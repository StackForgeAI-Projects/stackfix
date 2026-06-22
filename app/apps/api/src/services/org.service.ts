import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { notFound, forbidden } from "../lib/errors.js";
import type { AuthContext } from "../middleware/auth.js";
import { AuthService } from "./auth.service.js";
import { userNotificationService } from "./user-notification.service.js";
import { activityLogService } from "./activity-log.service.js";
import { generateSecurePassword } from "@stackfix/utils";

export class UserService {
  constructor(private db: PrismaClient = prisma) {}

  async list(auth: AuthContext) {
    const users = await this.db.user.findMany({
      where: { organisationId: auth.organisationId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { createdTickets: true } },
      },
      orderBy: { fullName: "asc" },
    });
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      ticketCount: u._count.createdTickets,
    }));
  }

  async create(
    auth: AuthContext,
    input: {
      fullName: string;
      email?: string;
      phone?: string;
      password?: string;
      role: "admin" | "technician";
    },
  ) {
    const tempPassword = input.password ?? generateSecurePassword();
    const email = input.email?.toLowerCase() ?? `${input.phone?.replace(/\D/g, "")}@stackfix.app`;
    const passwordHash = await AuthService.hashPassword(tempPassword);
    const user = await this.db.user.create({
      data: {
        organisationId: auth.organisationId,
        fullName: input.fullName,
        email,
        phone: input.phone,
        passwordHash,
        role: input.role,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
    userNotificationService.pushManagers(auth.organisationId, auth.userId, {
      type: "team_member",
      title: "Team member added",
      body: `${user.fullName} joined as ${user.role.replace(/_/g, " ")}`,
      href: "/team",
    });
    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "user_created",
      { memberName: user.fullName, role: user.role },
      "/team",
    );
    return { ...user, tempPassword };
  }

  async update(
    auth: AuthContext,
    userId: string,
    input: {
      fullName?: string;
      email?: string;
      phone?: string;
      role?: "admin" | "technician";
    },
  ) {
    const existing = await this.db.user.findFirst({
      where: { id: userId, organisationId: auth.organisationId },
    });
    if (!existing) throw notFound("User");
    if (existing.role === "super_admin") throw forbidden("Cannot modify super admin");

    const data: {
      fullName?: string;
      email?: string;
      phone?: string | null;
      role?: "admin" | "technician";
    } = {};
    if (input.fullName) data.fullName = input.fullName;
    if (input.role) data.role = input.role;
    if (input.email) data.email = input.email.toLowerCase();
    if (input.phone !== undefined) data.phone = input.phone || null;

    const updated = await this.db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        lastLoginAt: true,
      },
    });
    userNotificationService.pushManagers(auth.organisationId, auth.userId, {
      type: "team_member",
      title: "Team member updated",
      body: `${updated.fullName}'s profile was updated`,
      href: "/team",
    });
    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "user_updated",
      { memberName: updated.fullName },
      "/team",
    );
    return updated;
  }

  async setAccess(auth: AuthContext, userId: string, isActive: boolean) {
    const user = await this.db.user.findFirst({
      where: { id: userId, organisationId: auth.organisationId },
    });
    if (!user) throw notFound("User");
    if (user.role === "super_admin") throw forbidden("Cannot change super admin access");
    if (userId === auth.userId) throw forbidden("Cannot change your own access");

    const updated = await this.db.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, fullName: true, isActive: true },
    });

    if (!isActive) {
      await this.db.refreshToken.deleteMany({ where: { userId } });
    }

    userNotificationService.pushManagers(auth.organisationId, auth.userId, {
      type: "team_member",
      title: isActive ? "Team member restored" : "Team member access revoked",
      body: isActive
        ? `${updated.fullName} can sign in again`
        : `${updated.fullName}'s dashboard access was revoked`,
      href: "/team",
    });
    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "user_access_changed",
      { memberName: updated.fullName, isActive },
      "/team",
    );
    return updated;
  }

  async remove(auth: AuthContext, userId: string) {
    const user = await this.db.user.findFirst({
      where: { id: userId, organisationId: auth.organisationId },
    });
    if (!user) throw notFound("User");
    if (user.role === "super_admin") throw forbidden("Cannot delete super admin");
    if (userId === auth.userId) throw forbidden("Cannot delete your own account");

    const messageCount = await this.db.staffMessage.count({ where: { senderId: userId } });
    if (messageCount > 0) {
      throw forbidden("Cannot delete a member who has sent messages. Revoke access instead.");
    }

    await this.db.$transaction(async (tx) => {
      await tx.refreshToken.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.userNotification.deleteMany({ where: { userId } });
      await tx.ticketNote.deleteMany({ where: { userId } });
      await tx.ticket.updateMany({ where: { technicianId: userId }, data: { technicianId: null } });
      await tx.ticketStatusHistory.updateMany({
        where: { changedByUserId: userId },
        data: { changedByUserId: null },
      });
      await tx.staffMessage.updateMany({ where: { resolvedById: userId }, data: { resolvedById: null } });
      await tx.user.delete({ where: { id: userId } });
    });

    userNotificationService.pushManagers(auth.organisationId, auth.userId, {
      type: "team_member",
      title: "Team member deleted",
      body: `${user.fullName} was permanently removed`,
      href: "/team",
    });
    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "user_deleted",
      { memberName: user.fullName },
      "/team",
    );
    return { id: userId, fullName: user.fullName };
  }
}

export const userService = new UserService();

export class OrgService {
  constructor(private db: PrismaClient = prisma) {}

  async get(auth: AuthContext) {
    const org = await this.db.organisation.findUnique({
      where: { id: auth.organisationId },
    });
    if (!org) throw notFound("Organisation");
    return org;
  }

  async update(auth: AuthContext, data: Record<string, unknown>) {
    const org = await this.db.organisation.update({
      where: { id: auth.organisationId },
      data,
    });
    activityLogService.log(auth.organisationId, auth.userId, "org_updated", {}, "/settings");
    return org;
  }
}

export const orgService = new OrgService();

export class AnalyticsService {
  constructor(private db: PrismaClient = prisma) {}

  async dashboard(auth: AuthContext) {
    const orgId = auth.organisationId;
    const [totalTickets, pending, underRepair, completedToday, revenueAgg, unpaidInvoices] =
      await Promise.all([
        this.db.ticket.count({ where: { organisationId: orgId } }),
        this.db.ticket.count({ where: { organisationId: orgId, status: "pending" } }),
        this.db.ticket.count({ where: { organisationId: orgId, status: "under_repair" } }),
        this.db.ticket.count({
          where: {
            organisationId: orgId,
            status: { in: ["completed", "picked_up"] },
            updatedAt: { gte: startOfToday() },
          },
        }),
        this.db.payment.aggregate({
          where: { organisationId: orgId, status: "successful" },
          _sum: { amount: true },
        }),
        this.db.invoice.count({
          where: { organisationId: orgId, status: { in: ["sent", "overdue"] } },
        }),
      ]);

    return {
      totalTickets,
      pending,
      underRepair,
      completedToday,
      totalRevenue: Number(revenueAgg._sum.amount ?? 0),
      awaitingPaymentCount: unpaidInvoices,
    };
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const analyticsService = new AnalyticsService();

export class CustomerService {
  constructor(private db: PrismaClient = prisma) {}

  async list(auth: AuthContext, q?: string) {
    return this.db.customer.findMany({
      where: {
        organisationId: auth.organisationId,
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { fullName: "asc" },
      take: 50,
    });
  }

  async getById(auth: AuthContext, id: string) {
    const customer = await this.db.customer.findFirst({
      where: { id, organisationId: auth.organisationId },
      include: {
        tickets: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!customer) throw notFound("Customer");
    return customer;
  }

  async create(
    auth: AuthContext,
    input: { fullName: string; phone: string; email?: string },
  ) {
    const { normalizeRwandaPhone } = await import("@stackfix/utils");
    return this.db.customer.create({
      data: {
        organisationId: auth.organisationId,
        fullName: input.fullName,
        phone: normalizeRwandaPhone(input.phone),
        email: input.email,
      },
    });
  }
}

export const customerService = new CustomerService();

export class PaymentService {
  constructor(private db: PrismaClient = prisma) {}

  async list(auth: AuthContext, query: { cursor?: string; limit: number }) {
    const payments = await this.db.payment.findMany({
      where: { organisationId: auth.organisationId, status: "successful" },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { confirmedAt: "desc" },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            customer: { select: { fullName: true, phone: true } },
            ticket: { select: { ticketNumber: true } },
          },
        },
      },
    });
    const hasMore = payments.length > query.limit;
    const data = hasMore ? payments.slice(0, query.limit) : payments;
    return {
      data,
      pagination: { cursor: hasMore ? data[data.length - 1]?.id ?? null : null, hasMore },
    };
  }
}

export const paymentService = new PaymentService();
