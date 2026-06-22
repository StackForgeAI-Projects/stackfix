import type { UserNotificationItem } from "@stackfix/types";

export type GroupedNotification = {
  key: string;
  items: UserNotificationItem[];
  latest: UserNotificationItem;
  unreadCount: number;
  href?: string;
};

function groupKey(item: UserNotificationItem): string {
  const messageMatch = item.href?.match(/\/messages\?id=([^&]+)/);
  if (messageMatch) return `message:${messageMatch[1]}`;

  const ticketMatch = item.href?.match(/\/tickets\/([^/?]+)/);
  if (ticketMatch) return `ticket:${ticketMatch[1]}`;

  return item.id;
}

export function groupNotifications(items: UserNotificationItem[]): GroupedNotification[] {
  const map = new Map<string, UserNotificationItem[]>();

  for (const item of items) {
    const key = groupKey(item);
    map.set(key, [...(map.get(key) ?? []), item]);
  }

  return [...map.entries()]
    .map(([key, groupItems]) => {
      const sorted = [...groupItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return {
        key,
        items: sorted,
        latest: sorted[0]!,
        unreadCount: sorted.filter((i) => !i.read).length,
        href: sorted.find((i) => i.href)?.href ?? undefined,
      };
    })
    .sort((a, b) => new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime());
}
