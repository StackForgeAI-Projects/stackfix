"use client";

import { AppShell } from "@/components/AppShell";
import { Pager } from "@/components/Pager";
import { formatDateTime } from "@/lib/format-i18n";
import { useAuth } from "@/components/AuthProvider";
import { activityMeta } from "@/lib/activity-ui";
import { api } from "@/lib/api";
import { useRoleLabel } from "@/lib/i18n-labels";
import type { ActivityLogItem } from "@stackfix/types";
import { ACTIVITY_CATEGORIES, canViewActivityLog, type ActivityCategory } from "@stackfix/utils";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ActivityPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [category, setCategory] = useState<ActivityCategory>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const canView = user ? canViewActivityLog(user.role) : false;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity", category, page, pageSize],
    queryFn: () => api.activity({ page, limit: pageSize, category }),
    enabled: !authLoading && canView,
  });

  const items = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: pageSize, total: 0, totalPages: 1 };
  const categoryLabel = t(`activity.category.${category}`).toLowerCase();

  if (!authLoading && user && !canView) {
    return (
      <AppShell>
        <div className="p-8 max-w-3xl mx-auto text-center text-muted-foreground">
          {t("activity.forbidden")}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t("activity.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total > 0
              ? t("activity.subtitleCount", { count: pagination.total })
              : t("activity.subtitle")}
            {category !== "all" && pagination.total > 0 && (
              <span> · {t("activity.inCategory", { category: categoryLabel })}</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {ACTIVITY_CATEGORIES.map((c) => (
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
              {t(`activity.category.${c.id}`)}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-muted-foreground">{t("activity.loading")}</p>}
        {isError && <p className="text-muted-foreground">{t("activity.loadError")}</p>}

        {!isLoading && !isError && items.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <History className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">{t("activity.empty")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {category === "all"
                ? t("activity.emptyAll")
                : t("activity.emptyCategory", { category: categoryLabel })}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item as ActivityLogItem} />
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
            options={[10, 15, 25, 50]}
          />
        )}
      </div>
    </AppShell>
  );
}

function ActivityRow({ item }: { item: ActivityLogItem }) {
  const { t } = useTranslation();
  const roleLabel = useRoleLabel(item.user.role);
  const meta = activityMeta[item.action];
  const Icon = meta.icon;
  const description = t(`activity.action.${item.action}`, {
    ...item.metadata,
    role: item.metadata.role ? t(`roles.${item.metadata.role}`, { defaultValue: String(item.metadata.role) }) : undefined,
    fromStatus:
      typeof item.metadata.fromStatus === "string"
        ? t(`status.ticket.${item.metadata.fromStatus}`)
        : undefined,
    toStatus:
      typeof item.metadata.toStatus === "string"
        ? t(`status.ticket.${item.metadata.toStatus}`)
        : undefined,
    defaultValue: item.action,
  });

  const inner = (
    <>
      <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${meta.tint}`}>
        <Icon className="size-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="text-sm font-semibold text-foreground">{item.user.fullName}</p>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand">{roleLabel}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
          {formatDateTime(item.createdAt)}
        </p>
      </div>
    </>
  );

  const className =
    "flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-brand/30 transition-colors";

  if (item.href) {
    return (
      <Link href={item.href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
