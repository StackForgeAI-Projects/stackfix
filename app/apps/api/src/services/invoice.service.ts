import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { nextInvoiceNumber } from "../repositories/counters.js";
import {
  calculateInvoiceTotals,
  generateUssdCode,
  canCreateInvoice,
  canDeleteInvoice,
  canEditInvoice,
  canMarkInvoicePaid,
  canAccessFinancials,
} from "@stackfix/utils";
import { businessRule, conflict, notFound, forbidden } from "../lib/errors.js";
import type { AuthContext } from "../middleware/auth.js";
import { renderInvoiceHtml } from "@stackfix/utils";
import { userNotificationService } from "./user-notification.service.js";
import { activityLogService } from "./activity-log.service.js";
import { customerNotificationService } from "./customer-notification.service.js";

export class InvoiceService {
  constructor(private db: PrismaClient = prisma) {}

  async list(auth: AuthContext, query: { cursor?: string; limit: number; status?: string }) {
    if (!canAccessFinancials(auth.role)) throw forbidden();
    const invoices = await this.db.invoice.findMany({
      where: {
        organisationId: auth.organisationId,
        ...(query.status ? { status: query.status as never } : {}),
      },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            deviceType: true,
            deviceModel: true,
            deviceBrand: true,
            faultDescription: true,
          },
        },
        lineItems: true,
      },
    });
    const hasMore = invoices.length > query.limit;
    const data = hasMore ? invoices.slice(0, query.limit) : invoices;
    return {
      data,
      pagination: { cursor: hasMore ? data[data.length - 1]?.id ?? null : null, hasMore },
    };
  }

  async getById(auth: AuthContext, id: string) {
    if (!canAccessFinancials(auth.role)) throw forbidden();
    const invoice = await this.db.invoice.findFirst({
      where: { id, organisationId: auth.organisationId },
      include: {
        lineItems: { orderBy: { sortOrder: "asc" } },
        customer: true,
        ticket: true,
        payments: true,
      },
    });
    if (!invoice) throw notFound("Invoice");
    return invoice;
  }

  async create(
    auth: AuthContext,
    input: {
      ticketId: string;
      lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        itemType?: "part" | "labour" | "diagnostic" | "other";
      }>;
      dueDate?: string;
    },
  ) {
    if (!canCreateInvoice(auth.role)) throw forbidden();
    const existing = await this.db.invoice.findUnique({ where: { ticketId: input.ticketId } });
    if (existing) throw conflict("Invoice already exists for this ticket");

    const ticket = await this.db.ticket.findFirst({
      where: { id: input.ticketId, organisationId: auth.organisationId },
      include: { customer: true },
    });
    if (!ticket) throw notFound("Ticket");

    const org = await this.db.organisation.findUniqueOrThrow({
      where: { id: auth.organisationId },
    });
    const vatRate = Number(org.defaultVatRate);
    const totals = calculateInvoiceTotals(input.lineItems, vatRate);
    const invoiceNumber = await nextInvoiceNumber(this.db, auth.organisationId);
    const ussdCode = generateUssdCode(totals.totalAmount, invoiceNumber);

    const invoice = await this.db.invoice.create({
      data: {
        organisationId: auth.organisationId,
        ticketId: ticket.id,
        invoiceNumber,
        customerId: ticket.customerId,
        subtotal: totals.subtotal,
        vatRate,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        ussdCode,
        ussdReference: invoiceNumber,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        status: "draft",
        lineItems: {
          create: input.lineItems.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: Math.round(item.quantity * item.unitPrice),
            itemType: item.itemType ?? "labour",
            sortOrder: i,
          })),
        },
      },
      include: { lineItems: true, customer: true, ticket: true },
    });

    userNotificationService.pushManagers(auth.organisationId, auth.userId, {
      type: "invoice_created",
      title: "Invoice created",
      body: `${invoice.invoiceNumber} for ${ticket.customer.fullName}`,
      href: `/invoices?id=${invoice.id}`,
    });

    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "invoice_created",
      { invoiceNumber: invoice.invoiceNumber, ticketNumber: ticket.ticketNumber },
      `/invoices?id=${invoice.id}`,
    );

    return invoice;
  }

  async send(auth: AuthContext, id: string) {
    const invoice = await this.getById(auth, id);
    if (invoice.status === "paid") {
      throw businessRule("Cannot send a paid invoice");
    }
    const updated = await this.db.invoice.update({
      where: { id },
      data: { status: "sent" },
      include: { lineItems: true, customer: true, ticket: true },
    });
    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "invoice_sent",
      { invoiceNumber: updated.invoiceNumber },
      `/invoices?id=${updated.id}`,
    );
    customerNotificationService.notifyInvoiceRaised(updated.id);
    return updated;
  }

  async markPaidCash(auth: AuthContext, id: string, paymentMethod: "cash" | "card" | "other", notes?: string) {
    if (!canMarkInvoicePaid(auth.role)) throw forbidden();
    const invoice = await this.getById(auth, id);
    if (invoice.status === "paid") throw businessRule("Invoice is already paid");

    const updated = await this.db.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          organisationId: auth.organisationId,
          invoiceId: id,
          amount: invoice.totalAmount,
          paymentMethod,
          status: "successful",
          confirmedAt: new Date(),
          notes,
        },
      });
      const updated = await tx.invoice.update({
        where: { id },
        data: { status: "paid", paidAt: new Date() },
        include: { lineItems: true, customer: true, ticket: true },
      });

      userNotificationService.pushManagers(auth.organisationId, auth.userId, {
        type: "invoice_paid",
        title: "Invoice marked paid",
        body: `${updated.invoiceNumber} · ${updated.customer.fullName}`,
        href: `/invoices?id=${updated.id}`,
      });

      activityLogService.log(
        auth.organisationId,
        auth.userId,
        "invoice_paid",
        { invoiceNumber: updated.invoiceNumber },
        `/invoices?id=${updated.id}`,
      );

      return updated;
    });

    customerNotificationService.notifyPaymentReceived(updated.id);
    return updated;
  }

  async update(
    auth: AuthContext,
    id: string,
    input: {
      lineItems?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        itemType?: "part" | "labour" | "diagnostic" | "other";
      }>;
      dueDate?: string;
    },
  ) {
    if (!canEditInvoice(auth.role)) throw forbidden();
    const invoice = await this.getById(auth, id);
    if (invoice.status === "paid") throw businessRule("Cannot edit a paid invoice");

    const org = await this.db.organisation.findUniqueOrThrow({ where: { id: auth.organisationId } });
    const vatRate = Number(invoice.vatRate);
    const lineItems = input.lineItems ?? invoice.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      itemType: li.itemType as "part" | "labour" | "diagnostic" | "other",
    }));
    const totals = calculateInvoiceTotals(lineItems, vatRate);
    const ussdCode = generateUssdCode(totals.totalAmount, invoice.invoiceNumber);

    return this.db.$transaction(async (tx) => {
      if (input.lineItems) {
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
        await tx.invoiceLineItem.createMany({
          data: lineItems.map((item, i) => ({
            invoiceId: id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: Math.round(item.quantity * item.unitPrice),
            itemType: item.itemType ?? "labour",
            sortOrder: i,
          })),
        });
      }
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          subtotal: totals.subtotal,
          vatAmount: totals.vatAmount,
          totalAmount: totals.totalAmount,
          ussdCode,
          ...(input.dueDate ? { dueDate: new Date(input.dueDate) } : {}),
        },
        include: { lineItems: true, customer: true, ticket: true },
      });
      activityLogService.log(
        auth.organisationId,
        auth.userId,
        "invoice_updated",
        { invoiceNumber: updated.invoiceNumber },
        `/invoices?id=${updated.id}`,
      );
      return updated;
    });
  }

  async deleteInvoice(auth: AuthContext, id: string) {
    if (!canDeleteInvoice(auth.role)) throw forbidden();
    const invoice = await this.getById(auth, id);
    if (invoice.status === "paid") throw businessRule("Cannot delete a paid invoice");
    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "invoice_deleted",
      { invoiceNumber: invoice.invoiceNumber },
    );
    await this.deleteInvoiceRecords(id);
    return { deleted: true };
  }

  /** Removes line items, payments, and invoice row (unpaid only). */
  async deleteInvoiceRecords(invoiceId: string) {
    await this.db.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { invoiceId } });
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId } });
      await tx.invoice.delete({ where: { id: invoiceId } });
    });
  }

  async generatePdfHtml(auth: AuthContext, id: string): Promise<string> {
    const invoice = await this.getById(auth, id);
    const org = await this.db.organisation.findUniqueOrThrow({
      where: { id: auth.organisationId },
    });
    return renderInvoiceHtml({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt.toISOString().slice(0, 10),
      businessName: org.name,
      businessAddress: org.address ?? undefined,
      businessPhone: org.phone ?? undefined,
      businessEmail: org.email ?? undefined,
      rdbNumber: org.rdbNumber ?? undefined,
      logoUrl: org.logoUrl ?? undefined,
      customerName: invoice.customer.fullName,
      customerPhone: invoice.customer.phone,
      deviceDescription: [invoice.ticket.deviceBrand, invoice.ticket.deviceModel, invoice.ticket.deviceType]
        .filter(Boolean)
        .join(" "),
      faultDescription: invoice.ticket.faultDescription,
      lineItems: invoice.lineItems.map((li) => ({
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        totalPrice: Number(li.totalPrice),
      })),
      subtotal: Number(invoice.subtotal),
      vatRate: Number(invoice.vatRate),
      vatAmount: Number(invoice.vatAmount),
      totalAmount: Number(invoice.totalAmount),
      ussdCode: invoice.ussdCode ?? undefined,
    });
  }
}

export const invoiceService = new InvoiceService();
