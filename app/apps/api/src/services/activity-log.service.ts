import type { ActivityAction, PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuthContext } from "../middleware/auth.js";
import { forbidden } from "../lib/errors.js";
import { actionsForCategory, canViewActivityLog, type ActivityCategory } from "@stackfix/utils";

function serialize(row: {
  id: string;
  action: ActivityAction;
  metadata: unknown;
  href: string | null;
  createdAt: Date;
  user: { id: string; fullName: string; role: string };
}) {
  return {
    id: row.id,
    action: row.action,
    metadata: (row.metadata ?? {}) as Record<string, string | number | boolean | null>,
    href: row.href,
    createdAt: row.createdAt.toISOString(),
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
      role: row.user.role,
    },
  };
}

export class ActivityLogService {
  constructor(private db: PrismaClient = prisma) {}

  log(
    organisationId: string,
    userId: string,
    action: ActivityAction,
    metadata: Record<string, string | number | boolean | null> = {},
    href?: string,
  ) {
    void this.db.activityLog
      .create({
        data: {
          organisationId,
          userId,
          action,
          metadata,
          href: href ?? null,
        },
      })
      .catch(() => undefined);
  }

  async list(
    auth: AuthContext,
    query: { page?: number; limit?: number; category?: ActivityCategory } = {},
  ) {
    if (!canViewActivityLog(auth.role)) throw forbidden();

    const page = query.page ?? 1;
    const limit = query.limit ?? 15;
    const category = query.category ?? "all";
    const actions = actionsForCategory(category);

    const where = {
      organisationId: auth.organisationId,
      ...(actions ? { action: { in: actions } } : {}),
    };

    const [total, rows] = await Promise.all([
      this.db.activityLog.count({ where }),
      this.db.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
        },
      }),
    ]);

    return {
      data: rows.map(serialize),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

export const activityLogService = new ActivityLogService();
