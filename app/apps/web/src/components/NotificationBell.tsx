"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { NOTIFICATION_POLL_MS } from "@/lib/poll";

export function NotificationBell() {
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => api.notificationsUnreadCount(),
    refetchInterval: NOTIFICATION_POLL_MS,
    refetchIntervalInBackground: false,
  });

  const unreadCount = data?.data.unreadCount ?? 0;

  return (
    <Link
      href="/notifications"
      className="size-9 grid place-items-center rounded-full border-0 shadow-none outline-none ring-0 transition-colors relative hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
    >
      <Bell className="size-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-brand text-ink text-[10px] font-bold grid place-items-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
