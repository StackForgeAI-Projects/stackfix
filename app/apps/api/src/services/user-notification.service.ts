import type { PrismaClient, UserNotificationType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuthContext } from "../middleware/auth.js";
import { notFound } from "../lib/errors.js";
import { isManager, notificationTypesForCategory, type NotificationCategory } from "@stackfix/utils";

type NotifyPayload = {
  type: UserNotificationType;
  title: string;
  body: string;
  href?: string;
};

function serialize(row: {
  id: string;
  type: UserNotificationType;
  title: string;
  body: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href,
    read: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

function emit(fn: () => Promise<void>) {
  void fn().catch(() => undefined);
}

export class UserNotificationService {
  constructor(private db: PrismaClient = prisma) {}

  async notifyUsers(orgId: string, userIds: string[], payload: NotifyPayload) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return;
    await this.db.userNotification.createMany({
      data: unique.map((userId) => ({
        organisationId: orgId,
        userId,
        ...payload,
      })),
    });
  }

  async notifyManagers(orgId: string, excludeUserId: string | null, payload: NotifyPayload) {
    const managers = await this.db.user.findMany({
      where: {
        organisationId: orgId,
        isActive: true,
        role: { in: ["super_admin", "admin"] },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    await this.notifyUsers(
      orgId,
      managers.map((m) => m.id),
      payload,
    );
  }

  push(orgId: string, userIds: string[], payload: NotifyPayload) {
    emit(() => this.notifyUsers(orgId, userIds, payload));
  }

  pushManagers(orgId: string, excludeUserId: string | null, payload: NotifyPayload) {
    emit(() => this.notifyManagers(orgId, excludeUserId, payload));
  }

  async list(
    auth: AuthContext,
    query: { page?: number; limit?: number; category?: NotificationCategory } = {},
  ) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const types = notificationTypesForCategory(query.category ?? "all");

    const where = {
      userId: auth.userId,
      organisationId: auth.organisationId,
      ...(types ? { type: { in: types as UserNotificationType[] } } : {}),
    };

    const [rows, total, unreadCount] = await Promise.all([
      this.db.userNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.userNotification.count({ where }),
      this.db.userNotification.count({
        where: { userId: auth.userId, organisationId: auth.organisationId, readAt: null },
      }),
    ]);

    return {
      data: rows.map(serialize),
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async unreadCount(auth: AuthContext) {
    const count = await this.db.userNotification.count({
      where: { userId: auth.userId, organisationId: auth.organisationId, readAt: null },
    });
    return { unreadCount: count };
  }

  async markRead(auth: AuthContext, id: string) {
    const row = await this.db.userNotification.findFirst({
      where: { id, userId: auth.userId, organisationId: auth.organisationId },
    });
    if (!row) throw notFound("Notification");
    const updated = await this.db.userNotification.update({
      where: { id },
      data: { readAt: row.readAt ?? new Date() },
    });
    return serialize(updated);
  }

  async markAllRead(auth: AuthContext) {
    await this.db.userNotification.updateMany({
      where: {
        userId: auth.userId,
        organisationId: auth.organisationId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}

export const userNotificationService = new UserNotificationService();

/** Notify ticket creator when a manager changes status. */
export async function notifyTicketStatusChange(
  db: PrismaClient,
  auth: AuthContext,
  ticket: { id: string; ticketNumber: string; createdByUserId: string | null },
  fromStatus: string,
  toStatus: string,
  actorName: string,
) {
  const recipients: string[] = [];
  if (ticket.createdByUserId && ticket.createdByUserId !== auth.userId) {
    recipients.push(ticket.createdByUserId);
  }
  if (isManager(auth.role)) {
    await userNotificationService.pushManagers(auth.organisationId, auth.userId, {
      type: "ticket_status",
      title: "Ticket status updated",
      body: `#${ticket.ticketNumber}: ${fromStatus.replace(/_/g, " ")} → ${toStatus.replace(/_/g, " ")} by ${actorName}`,
      href: `/tickets/${ticket.id}`,
    });
  }
  userNotificationService.push(auth.organisationId, recipients, {
    type: "ticket_status",
    title: "Your ticket was updated",
    body: `#${ticket.ticketNumber} is now ${toStatus.replace(/_/g, " ")}`,
    href: `/tickets/${ticket.id}`,
  });
}
