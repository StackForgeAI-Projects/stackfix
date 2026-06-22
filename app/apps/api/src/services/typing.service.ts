const TTL_MS = 5000;

type TypingEntry = { userName: string; expiresAt: number };

const rooms = new Map<string, Map<string, TypingEntry>>();

function pruneRoom(threadId: string) {
  const room = rooms.get(threadId);
  if (!room) return;
  const now = Date.now();
  for (const [userId, entry] of room) {
    if (entry.expiresAt <= now) room.delete(userId);
  }
  if (room.size === 0) rooms.delete(threadId);
}

export const typingService = {
  setTyping(threadId: string, userId: string, userName: string) {
    if (!rooms.has(threadId)) rooms.set(threadId, new Map());
    rooms.get(threadId)!.set(userId, { userName, expiresAt: Date.now() + TTL_MS });
    pruneRoom(threadId);
  },

  getTypers(threadId: string, excludeUserId: string): string[] {
    pruneRoom(threadId);
    const room = rooms.get(threadId);
    if (!room) return [];
    return [...room.entries()]
      .filter(([id]) => id !== excludeUserId)
      .map(([, entry]) => entry.userName);
  },
};
