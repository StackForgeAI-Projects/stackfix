import type { AuthContext } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { isManager } from "@stackfix/utils";
import { userNotificationService } from "./user-notification.service.js";
import { activityLogService } from "./activity-log.service.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ticketRefCandidates(ref: string): string[] {
  const trimmed = ref.trim();
  const candidates = new Set<string>([trimmed]);
  if (/^\d+$/.test(trimmed)) {
    candidates.add(`TKT-${String(Number(trimmed)).padStart(4, "0")}`);
  }
  const ticketDigits = trimmed.match(/^TKT-(\d+)$/i);
  if (ticketDigits) {
    candidates.add(`TKT-${String(Number(ticketDigits[1])).padStart(4, "0")}`);
  }
  return [...candidates];
}

async function resolveTicketId(organisationId: string, ref: string): Promise<string> {
  if (UUID_RE.test(ref)) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ref, organisationId },
      select: { id: true },
    });
    if (ticket) return ticket.id;
    throw new AppError("NOT_FOUND", "Ticket not found", 404);
  }

  for (const ticketNumber of ticketRefCandidates(ref)) {
    const ticket = await prisma.ticket.findFirst({
      where: { organisationId, ticketNumber: { equals: ticketNumber, mode: "insensitive" } },
      select: { id: true },
    });
    if (ticket) return ticket.id;
  }

  throw new AppError("NOT_FOUND", `No ticket found for "${ref}"`, 404);
}

const messageInclude = {
  sender: { select: { id: true, fullName: true, role: true } },
  ticket: { select: { id: true, ticketNumber: true } },
  replies: {
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: { select: { id: true, fullName: true, role: true } },
    },
  },
  resolvedBy: { select: { id: true, fullName: true } },
};

function serializeMessage(row: {
  id: string;
  subject: string;
  body: string;
  requestType: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
  sender: { id: string; fullName: string; role: string };
  ticket: { id: string; ticketNumber: string } | null;
  replies?: Array<{
    id: string;
    body: string;
    createdAt: Date;
    sender: { id: string; fullName: string; role: string };
  }>;
  resolvedBy: { id: string; fullName: string } | null;
}) {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    requestType: row.requestType,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    sender: row.sender,
    ticket: row.ticket,
    resolvedBy: row.resolvedBy,
    replies: row.replies?.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      sender: r.sender,
    })),
  };
}

export const messageService = {
  async listThreads(auth: AuthContext) {
    const roots = await prisma.staffMessage.findMany({
      where: {
        organisationId: auth.organisationId,
        parentId: null,
        ...(isManager(auth.role) ? {} : { senderId: auth.userId }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        sender: { select: { id: true, fullName: true, role: true } },
        ticket: { select: { id: true, ticketNumber: true } },
        _count: { select: { replies: true } },
      },
    });

    const openCount = isManager(auth.role)
      ? await prisma.staffMessage.count({
          where: { organisationId: auth.organisationId, parentId: null, status: "open" },
        })
      : 0;

    return {
      data: roots.map((r) => ({
        id: r.id,
        subject: r.subject,
        body: r.body,
        requestType: r.requestType,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        sender: r.sender,
        ticket: r.ticket,
        replyCount: r._count.replies,
      })),
      openCount,
    };
  },

  async getThread(auth: AuthContext, id: string) {
    const thread = await prisma.staffMessage.findFirst({
      where: {
        id,
        organisationId: auth.organisationId,
        parentId: null,
        ...(isManager(auth.role) ? {} : { senderId: auth.userId }),
      },
      include: messageInclude,
    });
    if (!thread) throw new AppError("NOT_FOUND", "Message not found", 404);
    return serializeMessage(thread);
  },

  async assertCanAccessThread(auth: AuthContext, id: string) {
    const thread = await prisma.staffMessage.findFirst({
      where: {
        id,
        organisationId: auth.organisationId,
        parentId: null,
        ...(isManager(auth.role) ? {} : { senderId: auth.userId }),
      },
      select: { id: true },
    });
    if (!thread) throw new AppError("NOT_FOUND", "Message not found", 404);
  },

  async pulseTyping(auth: AuthContext, threadId: string) {
    await this.assertCanAccessThread(auth, threadId);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: { fullName: true },
    });
    return user.fullName;
  },

  async createThread(
    auth: AuthContext,
    input: {
      subject: string;
      body: string;
      requestType: "general" | "edit_ticket" | "delete_ticket";
      ticketId?: string;
    },
  ) {
    const linkedTicketId = input.ticketId
      ? await resolveTicketId(auth.organisationId, input.ticketId)
      : undefined;

    const row = await prisma.staffMessage.create({
      data: {
        organisationId: auth.organisationId,
        senderId: auth.userId,
        ticketId: linkedTicketId,
        subject: input.subject,
        body: input.body,
        requestType: input.requestType,
      },
      include: messageInclude,
    });

    userNotificationService.pushManagers(auth.organisationId, auth.userId, {
      type: "message_new",
      title: "New staff message",
      body: `${row.sender.fullName}: ${input.subject}`,
      href: `/messages?id=${row.id}`,
    });

    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "message_sent",
      { subject: input.subject },
      `/messages?id=${row.id}`,
    );

    return serializeMessage({ ...row, replies: [] });
  },

  async reply(auth: AuthContext, threadId: string, body: string) {
    const thread = await prisma.staffMessage.findFirst({
      where: {
        id: threadId,
        organisationId: auth.organisationId,
        parentId: null,
      },
    });
    if (!thread) throw new AppError("NOT_FOUND", "Message not found", 404);

    if (!isManager(auth.role) && thread.senderId !== auth.userId) {
      throw new AppError("FORBIDDEN", "You cannot reply to this thread", 403);
    }

    await prisma.staffMessage.create({
      data: {
        organisationId: auth.organisationId,
        senderId: auth.userId,
        parentId: threadId,
        subject: `Re: ${thread.subject}`,
        body,
        requestType: thread.requestType,
        status: "open",
      },
    });

    const sender = await prisma.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: { fullName: true, role: true },
    });

    if (isManager(auth.role)) {
      userNotificationService.push(auth.organisationId, [thread.senderId], {
        type: "message_reply",
        title: "Reply on your request",
        body: `${sender.fullName}: ${body.slice(0, 120)}${body.length > 120 ? "…" : ""}`,
        href: `/messages?id=${threadId}`,
      });
    } else {
      userNotificationService.pushManagers(auth.organisationId, auth.userId, {
        type: "message_reply",
        title: "New message reply",
        body: `${sender.fullName}: ${body.slice(0, 120)}${body.length > 120 ? "…" : ""}`,
        href: `/messages?id=${threadId}`,
      });
    }

    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "message_replied",
      { subject: thread.subject },
      `/messages?id=${threadId}`,
    );

    return this.getThread(auth, threadId);
  },

  async resolve(auth: AuthContext, threadId: string) {
    if (!isManager(auth.role)) {
      throw new AppError("FORBIDDEN", "Only admins can resolve messages", 403);
    }

    const thread = await prisma.staffMessage.findFirst({
      where: {
        id: threadId,
        organisationId: auth.organisationId,
        parentId: null,
      },
    });
    if (!thread) throw new AppError("NOT_FOUND", "Message not found", 404);

    await prisma.staffMessage.update({
      where: { id: threadId },
      data: {
        status: "resolved",
        resolvedById: auth.userId,
        resolvedAt: new Date(),
      },
    });

    const resolver = await prisma.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: { fullName: true },
    });

    userNotificationService.push(auth.organisationId, [thread.senderId], {
      type: "message_resolved",
      title: "Request resolved",
      body: `${resolver.fullName} resolved: ${thread.subject}`,
      href: `/messages?id=${threadId}`,
    });

    activityLogService.log(
      auth.organisationId,
      auth.userId,
      "message_resolved",
      { subject: thread.subject },
      `/messages?id=${threadId}`,
    );

    return this.getThread(auth, threadId);
  },
};
