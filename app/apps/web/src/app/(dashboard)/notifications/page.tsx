"use client";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { Pager } from "@/components/Pager";
import { groupNotifications, type GroupedNotification } from "@/lib/group-notifications";
import { notificationMeta } from "@/lib/notification-ui";
import { NOTIFICATION_POLL_MS } from "@/lib/poll";
import { api } from "@/lib/api";
import type { UserNotificationItem } from "@stackfix/types";
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from "@stackfix/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { useTranslation } from "react-i18next";
import { DynamicText } from "@/components/DynamicText";
import { RelativeTime } from "@/components/RelativeTime";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", category, page, pageSize],
    queryFn: () => api.notifications({ page, limit: pageSize, category }),
    enabled: !authLoading && !!user,
    refetchInterval: NOTIFICATION_POLL_MS,
    refetchIntervalInBackground: false,
  });

  const items = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const pagination = data?.pagination ?? { page: 1, limit: pageSize, total: 0, totalPages: 1 };
  const groups = groupNotifications(items as UserNotificationItem[]);
  const categoryLabel = t(`notifications.category.${category}`).toLowerCase();

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.markNotificationRead(id)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      toast.success("toast.notificationsRead");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("notifications.title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {unreadCount > 0
                ? t("notifications.unread", { count: unreadCount })
                : t("notifications.caughtUp")}
              {category !== "all" && pagination.total > 0 && (
                <span>{t("notifications.inCategory", { count: pagination.total, category: categoryLabel })}</span>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="stackfix-btn-outline px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              <CheckCheck className="size-3.5" /> {t("notifications.markAllRead")}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {NOTIFICATION_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategory(c.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                category === c.id
                  ? "bg-brand text-ink border-brand"
                  : "bg-card border-border text-muted-foreground hover:border-brand/40"
              }`}
            >
              {t(`notifications.category.${c.id}`)}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-muted-foreground">{t("notifications.loading")}</p>}
        {isError && <p className="text-muted-foreground">{t("notifications.loadError")}</p>}

        {!isLoading && !isError && groups.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Bell className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">{t("notifications.empty")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {category === "all"
                ? t("notifications.emptyAll")
                : t("notifications.emptyCategory", { category: categoryLabel })}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {groups.map((group) => (
            <NotificationGroupCard
              key={group.key}
              group={group}
              onMarkRead={() =>
                markRead.mutate(group.items.filter((i) => !i.read).map((i) => i.id))
              }
              marking={markRead.isPending}
            />
          ))}
        </div>

        {pagination.total > 0 && (
          <Pager
            page={page}
            pageSize={pageSize}
            total={pagination.total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            options={[5, 10, 20, 30]}
          />
        )}
      </div>
    </AppShell>
  );
}

function NotificationGroupCard({
  group,
  onMarkRead,
  marking,
}: {
  group: GroupedNotification;
  onMarkRead: () => void;
  marking: boolean;
}) {
  const { t } = useTranslation();
  const item = group.latest;
  const meta = notificationMeta[item.type];
  const Icon = meta.icon;
  const hasUnread = group.unreadCount > 0;

  const inner = (
    <>
      <div className={`size-10 rounded-xl grid place-items-center shrink-0 relative ${meta.tint}`}>
        <Icon className="size-5" />
        {group.unreadCount > 1 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-brand text-ink text-[10px] font-bold grid place-items-center">
            {group.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-semibold truncate ${hasUnread ? "text-foreground" : "text-muted-foreground"}`}>
            <DynamicText text={item.title} />
          </p>
          {hasUnread && <span className="size-2 rounded-full bg-brand shrink-0" aria-hidden />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2"><DynamicText text={item.body} /></p>
        <p className="text-[10px] text-muted-foreground mt-1.5"><RelativeTime date={item.createdAt} /></p>
      </div>
      {hasUnread && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead();
          }}
          disabled={marking}
          className="text-[10px] font-semibold text-brand hover:underline shrink-0 self-start"
        >
          {t("notifications.markRead")}
        </button>
      )}
    </>
  );

  const className = `flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
    hasUnread ? "bg-card border-brand/30 shadow-sm" : "bg-card/60 border-border"
  }`;

  if (group.href) {
    return (
      <Link
        href={group.href}
        className={`${className} hover:border-brand/50`}
        onClick={() => hasUnread && onMarkRead()}
      >
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
