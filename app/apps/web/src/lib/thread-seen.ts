export function threadSeenKey(userId: string, threadId: string): string {
  return `sf:thread-seen:${userId}:${threadId}`;
}

export function getThreadSeenAt(userId: string, threadId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(threadSeenKey(userId, threadId));
}

export function setThreadSeenAt(userId: string, threadId: string, iso: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(threadSeenKey(userId, threadId), iso);
}
