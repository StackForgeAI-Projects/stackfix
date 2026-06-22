import type { Prisma, PrismaClient, TicketStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { nextTicketNumber } from "../repositories/counters.js";
import {
  canTransitionTicketStatus,
  canDeleteTicket,
  canEditTicket,
  canUpdateTicketStatus,
  normalizeRwandaPhone,
} from "@stackfix/utils";
import { businessRule, notFound, forbidden } from "../lib/errors.js";
import type { AuthContext } from "../middleware/auth.js";
import {
  notifyTicketStatusChange,
} from "./user-notification.service.js";
import { activityLogService } from "./activity-log.service.js";
import { customerNotificationService } from "./customer-notification.service.js";

export class TicketService {
  constructor(private db: PrismaClient = prisma) {}

  private technicianWhere(auth: AuthContext): Prisma.TicketWhereInput {
    return {
      OR: [{ technicianId: auth.userId }, { createdByUserId: auth.userId }],
    };
  }

  async list(
    auth: AuthContext,
    query: { cursor?: string; limit: number; status?: string; createdBy?: string; search?: string },
  ) {
    const where: Prisma.TicketWhereInput = {
      organisationId: auth.organisationId,
      ...(query.status && query.status !== "all"
        ? { status: query.status as TicketStatus }
        : {}),
      ...(auth.role === "technician" ? this.technicianWhere(auth) : {}),
      ...(query.createdBy && auth.role !== "technician"
        ? { createdByUserId: query.createdBy }
        : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { ticketNumber: { contains: query.search.trim(), mode: "insensitive" } },
              { deviceType: { contains: query.search.trim(), mode: "insensitive" } },
              { deviceBrand: { contains: query.search.trim(), mode: "insensitive" } },
              { deviceModel: { contains: query.search.trim(), mode: "insensitive" } },
              { faultDescription: { contains: query.search.trim(), mode: "insensitive" } },
              { customer: { fullName: { contains: query.search.trim(), mode: "insensitive" } } },
              { customer: { phone: { contains: query.search.trim() } } },
            ],
          }
        : {}),
    };

    const tickets = await this.db.ticket.findMany({
      where,
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        technician: { select: { id: true, fullName: true } },
        createdBy: { select: { id: true, fullName: true } },
        invoice: { select: { id: true, status: true, totalAmount: true } },
      },
    });

    const hasMore = tickets.length > query.limit;
    const data = hasMore ? tickets.slice(0, query.limit) : tickets;
    const cursor = hasMore ? data[data.length - 1]?.id ?? null : null;

    return { data, pagination: { cursor, hasMore, total: undefined } };
  }

  async getById(auth: AuthContext, id: string) {
    const ticket = await this.db.ticket.findFirst({
      where: { id, organisationId: auth.organisationId },
      include: {
        customer: true,
        technician: { select: { id: true, fullName: true } },
        createdBy: { select: { id: true, fullName: true } },
        invoice: { include: { lineItems: true, payments: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        notes: { include: { user: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!ticket) throw notFound("Ticket");
    if (
      auth.role === "technician" &&
      ticket.technicianId !== auth.userId &&
      ticket.createdByUserId !== auth.userId
    ) {
      throw forbidden();
    }
    return ticket;
  }

  async create(
    auth: AuthContext,
    input: {
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      deviceType: string;
      deviceBrand?: string;
      deviceModel?: string;
      faultDescription: string;
      internalNotes?: string;
      technicianId?: string;
      priority?: "low" | "normal" | "high" | "urgent";
    },
  ) {
    const phone = normalizeRwandaPhone(input.customerPhone);
    const customerName = input.customerName.trim();
    let customer = await this.db.customer.findFirst({
      where: { organisationId: auth.organisationId, phone },
    });
    if (!customer) {
      customer = await this.db.customer.create({
        data: {
          organisationId: auth.organisationId,
          fullName: customerName,
          phone,
          email: input.customerEmail?.trim() || null,
        },
      });
    } else {
      customer = await this.db.customer.update({
        where: { id: customer.id },
        data: {
          fullName: customerName,
          ...(input.customerEmail?.trim() ? { email: input.customerEmail.trim() } : {}),
        },
      });
    }

    const ticketNumber = await nextTicketNumber(this.db, auth.organisationId);
    const technicianId =
      input.technicianId ?? (auth.role === "technician" ? auth.userId : undefined);

    const ticket = await this.db.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          organisationId: auth.organisationId,
          ticketNumber,
          customerId: customer!.id,
          technicianId,
          createdByUserId: auth.userId,
          deviceType: input.deviceType,
          deviceBrand: input.deviceBrand,
          deviceModel: input.deviceModel,
          faultDescription: input.faultDescription,
          internalNotes: input.internalNotes,
          priority: input.priority ?? "normal",
          status: "pending",
        },
        include: {
          customer: true,
          technician: { select: { fullName: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
      });
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: created.id,
          fromStatus: null,
          toStatus: "pending",
          changedByUserId: auth.userId,
          trigger: "system",
        },
      });
      await tx.customer.update({
        where: { id: customer!.id },
        data: { totalRepairs: { increment: 1 } },
      });
      return created;
    });

    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "ticket_created",
      { ticketNumber: ticket.ticketNumber, customerName: ticket.customer.fullName },
      `/tickets/${ticket.id}`,
    );

    return ticket;
  }

  async update(
    auth: AuthContext,
    id: string,
    input: {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string | null;
      deviceType?: string;
      deviceBrand?: string | null;
      deviceModel?: string | null;
      faultDescription?: string;
      internalNotes?: string | null;
      technicianId?: string | null;
      priority?: "low" | "normal" | "high" | "urgent";
      status?: TicketStatus;
    },
  ) {
    if (!canEditTicket(auth.role)) throw forbidden();
    const ticket = await this.getById(auth, id);

    if (input.customerName || input.customerPhone || input.customerEmail !== undefined) {
      await this.db.customer.update({
        where: { id: ticket.customerId },
        data: {
          ...(input.customerName ? { fullName: input.customerName.trim() } : {}),
          ...(input.customerPhone ? { phone: normalizeRwandaPhone(input.customerPhone) } : {}),
          ...(input.customerEmail !== undefined
            ? { email: input.customerEmail?.trim() || null }
            : {}),
        },
      });
    }

    const { customerName: _cn, customerPhone: _cp, customerEmail: _ce, status, ...ticketData } = input;
    const hasFieldUpdates = Object.keys(ticketData).some(
      (k) => ticketData[k as keyof typeof ticketData] !== undefined,
    );
    const statusChanged = Boolean(status && status !== ticket.status);

    if (status && status !== ticket.status) {
      if (!canTransitionTicketStatus(ticket.status, status, auth.role)) {
        throw businessRule(`Invalid status transition: ${ticket.status} → ${status}`);
      }
      const org = await this.db.organisation.findUniqueOrThrow({
        where: { id: auth.organisationId },
      });
      const invoice = await this.db.invoice.findUnique({ where: { ticketId: id } });
      const invoicePaid = invoice?.status === "paid";
      if (
        org.paymentModel === "pay_before" &&
        status === "under_repair" &&
        ticket.status === "pending" &&
        !invoicePaid
      ) {
        throw businessRule("Payment required before starting repair (Pay Before Service model)");
      }
      if (
        org.paymentModel === "pay_on_pickup" &&
        status === "picked_up" &&
        ticket.status === "completed" &&
        !invoicePaid
      ) {
        throw businessRule("Payment required before pickup (Pay on Pickup model)");
      }
    }

    const result = await this.db.$transaction(async (tx) => {
      if (hasFieldUpdates) {
        await tx.ticket.update({
          where: { id },
          data: ticketData,
        });
      }

      if (status && status !== ticket.status) {
        await tx.ticket.update({ where: { id }, data: { status } });
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: id,
            fromStatus: ticket.status,
            toStatus: status,
            changedByUserId: auth.userId,
            trigger: "manual",
          },
        });
        const updated = await tx.ticket.findUniqueOrThrow({
          where: { id },
          include: {
            customer: true,
            technician: { select: { fullName: true } },
            createdBy: { select: { id: true, fullName: true } },
            invoice: true,
          },
        });
        const actor = await tx.user.findUniqueOrThrow({
          where: { id: auth.userId },
          select: { fullName: true },
        });
        void notifyTicketStatusChange(this.db, auth, updated, ticket.status, status, actor.fullName);
        activityLogService.log(
          auth.organisationId,
          auth.userId,
          "ticket_status_changed",
          {
            ticketNumber: updated.ticketNumber,
            fromStatus: ticket.status,
            toStatus: status,
          },
          `/tickets/${id}`,
        );
      }

      if (hasFieldUpdates) {
        activityLogService.log(
          auth.organisationId,
          auth.userId,
          "ticket_updated",
          { ticketNumber: ticket.ticketNumber },
          `/tickets/${id}`,
        );
      }

      return tx.ticket.findUniqueOrThrow({
        where: { id },
        include: {
          customer: true,
          technician: { select: { id: true, fullName: true } },
          createdBy: { select: { id: true, fullName: true } },
          invoice: { include: { lineItems: true, payments: true } },
          statusHistory: { orderBy: { createdAt: "asc" } },
          notes: {
            include: { user: { select: { fullName: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    });

    if (statusChanged && status) {
      customerNotificationService.notifyStatusChange(id, status);
    }

    return result;
  }

  async updateStatus(auth: AuthContext, id: string, status: TicketStatus) {
    if (!canUpdateTicketStatus(auth.role)) {
      throw forbidden("Your role cannot update ticket status");
    }

    const ticket = await this.getById(auth, id);
    if (!canTransitionTicketStatus(ticket.status, status, auth.role)) {
      throw businessRule(`Invalid status transition: ${ticket.status} → ${status}`);
    }

    const org = await this.db.organisation.findUniqueOrThrow({
      where: { id: auth.organisationId },
    });

    const invoice = await this.db.invoice.findUnique({ where: { ticketId: id } });
    const invoicePaid = invoice?.status === "paid";

    if (
      org.paymentModel === "pay_before" &&
      status === "under_repair" &&
      ticket.status === "pending" &&
      !invoicePaid
    ) {
      throw businessRule("Payment required before starting repair (Pay Before Service model)");
    }

    if (
      org.paymentModel === "pay_on_pickup" &&
      status === "picked_up" &&
      ticket.status === "completed" &&
      !invoicePaid
    ) {
      throw businessRule("Payment required before pickup (Pay on Pickup model)");
    }

    const updated = await this.db.$transaction(async (tx) => {
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: { status },
        include: {
          customer: true,
          invoice: true,
          createdBy: { select: { fullName: true } },
        },
      });
      await tx.ticketStatusHistory.create({
        data: {
          ticketId: id,
          fromStatus: ticket.status,
          toStatus: status,
          changedByUserId: auth.userId,
          trigger: "manual",
        },
      });

      const actor = await tx.user.findUniqueOrThrow({
        where: { id: auth.userId },
        select: { fullName: true },
      });
      void notifyTicketStatusChange(this.db, auth, updatedTicket, ticket.status, status, actor.fullName);
      activityLogService.log(
        auth.organisationId,
        auth.userId,
        "ticket_status_changed",
        {
          ticketNumber: updatedTicket.ticketNumber,
          fromStatus: ticket.status,
          toStatus: status,
        },
        `/tickets/${id}`,
      );

      return updatedTicket;
    });

    if (status !== ticket.status) {
      customerNotificationService.notifyStatusChange(id, status);
    }
    return updated;
  }

  async deleteTicket(auth: AuthContext, id: string) {
    if (!canDeleteTicket(auth.role)) throw forbidden();
    const ticket = await this.getById(auth, id);
    const invoice = await this.db.invoice.findUnique({ where: { ticketId: id } });
    if (invoice?.status === "paid") {
      throw businessRule("Cannot delete a ticket with a paid invoice");
    }

    await this.db.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { ticketId: id } });
      if (invoice) {
        await tx.payment.deleteMany({ where: { invoiceId: invoice.id } });
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: invoice.id } });
        await tx.invoice.delete({ where: { id: invoice.id } });
      }
      await tx.ticket.delete({ where: { id } });
    });

    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "ticket_deleted",
      { ticketNumber: ticket.ticketNumber },
    );

    return { deleted: true, invoiceDeleted: !!invoice };
  }

  async addNote(auth: AuthContext, ticketId: string, body: string) {
    const ticket = await this.getById(auth, ticketId);
    const note = await this.db.ticketNote.create({
      data: { ticketId, userId: auth.userId, body },
      include: { user: { select: { fullName: true } } },
    });
    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "ticket_note_added",
      { ticketNumber: ticket.ticketNumber },
      `/tickets/${ticketId}`,
    );
    return note;
  }

  async search(auth: AuthContext, q: string, limit = 20) {
    const result = await this.list(auth, { limit, search: q });
    return result.data;
  }
}

export const ticketService = new TicketService();
