"use client";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { ChatComposer, MessageBubble, NewMessagesDivider } from "@/components/messages/ChatComposer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api";
import { MESSAGE_POLL_MS, TYPING_POLL_MS } from "@/lib/poll";
import { getThreadSeenAt, setThreadSeenAt } from "@/lib/thread-seen";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatRelativeTime,
  isManager,
  staffMessageRequestLabel,
  staffMessageStatusBadgeClass,
} from "@stackfix/utils";
import type { StaffMessageRequestType } from "@stackfix/types";
import { CheckCircle2, MessageSquare, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

type ThreadSummary = {
  id: string;
  subject: string;
  body: string;
  requestType: StaffMessageRequestType;
  status: "open" | "resolved";
  createdAt: string;
  sender: { id: string; fullName: string; role: string };
  ticket: { id: string; ticketNumber: string } | null;
  replyCount: number;
};

type ThreadDetail = ThreadSummary & {
  replies: Array<{
    id: string;
    body: string;
    createdAt: string;
    sender: { id: string; fullName: string; role: string };
  }>;
  resolvedAt: string | null;
  resolvedBy: { id: string; fullName: string } | null;
};

function MessagesPageContent() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");
  const qc = useQueryClient();
  const manager = user ? isManager(user.role) : false;

  const compose = searchParams.get("compose");
  const prefilledTicketId = searchParams.get("ticketId") ?? "";
  const prefilledTicketNumber = searchParams.get("ticketNumber") ?? "";

  const [showCompose, setShowCompose] = useState(
    compose === "edit" || compose === "delete" || compose === "general",
  );
  const [subject, setSubject] = useState(
    compose === "edit" && prefilledTicketNumber
      ? `Edit request: #${prefilledTicketNumber}`
      : compose === "delete" && prefilledTicketNumber
        ? `Delete request: #${prefilledTicketNumber}`
        : "",
  );
  const [body, setBody] = useState(
    compose === "edit" && prefilledTicketNumber
      ? `Please review and approve edits for ticket #${prefilledTicketNumber}.`
      : compose === "delete" && prefilledTicketNumber
        ? `Please review and approve deletion of ticket #${prefilledTicketNumber}.`
        : "",
  );
  const [requestType, setRequestType] = useState<StaffMessageRequestType>(
    compose === "delete" ? "delete_ticket" : compose === "edit" ? "edit_ticket" : "general",
  );
  const [ticketId, setTicketId] = useState(prefilledTicketId);
  const [reply, setReply] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: () => api.messages(),
    enabled: !authLoading && !!user,
    refetchInterval: MESSAGE_POLL_MS,
    refetchIntervalInBackground: false,
  });

  const threads = (data?.data ?? []) as ThreadSummary[];
  const openCount = data?.openCount ?? 0;
  const activeId = selectedId ?? threads[0]?.id;

  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ["message", activeId],
    queryFn: () => api.message(activeId!),
    enabled: !!activeId && !authLoading && !!user,
    refetchInterval: MESSAGE_POLL_MS,
    refetchIntervalInBackground: false,
  });

  const thread = threadData?.data as ThreadDetail | undefined;

  const [seenBoundary, setSeenBoundary] = useState<string | null>(null);
  const threadRef = useRef(thread);

  threadRef.current = thread;

  useEffect(() => {
    if (!activeId || !user?.id) return;
    setSeenBoundary(getThreadSeenAt(user.id, activeId));
    return () => {
      const current = threadRef.current;
      if (!current) return;
      const messages = [
        { createdAt: current.createdAt },
        ...(current.replies ?? []).map((r) => ({ createdAt: r.createdAt })),
      ];
      const latest = messages[messages.length - 1]?.createdAt;
      if (latest) setThreadSeenAt(user.id, activeId, latest);
    };
  }, [activeId, user?.id]);

  const { data: typersData } = useQuery({
    queryKey: ["message-typers", activeId],
    queryFn: () => api.messageTypers(activeId!),
    enabled: !!activeId && !authLoading && !!user && !!thread && thread.status === "open",
    refetchInterval: TYPING_POLL_MS,
    refetchIntervalInBackground: false,
  });
  const typers = (typersData?.data ?? []) as string[];

  const pulseTyping = useCallback(() => {
    if (activeId) void api.messageTyping(activeId).catch(() => undefined);
  }, [activeId]);

  const chatMessages = useMemo(() => {
    if (!thread) return [];
    return [
      {
        id: thread.id,
        author: thread.sender.fullName,
        body: thread.body,
        isOwn: thread.sender.id === user?.id,
        createdAt: thread.createdAt,
      },
      ...(thread.replies ?? []).map((r) => ({
        id: r.id,
        author: r.sender.fullName,
        body: r.body,
        isOwn: r.sender.id === user?.id,
        createdAt: r.createdAt,
      })),
    ];
  }, [thread, user?.id]);

  const firstNewIndex = useMemo(() => {
    if (!seenBoundary) return -1;
    const boundary = new Date(seenBoundary).getTime();
    return chatMessages.findIndex((m) => new Date(m.createdAt).getTime() > boundary);
  }, [chatMessages, seenBoundary]);

  const createMessage = useMutation({
    mutationFn: () =>
      api.createMessage({
        subject,
        body,
        requestType,
        ...(ticketId.trim() ? { ticketId: ticketId.trim() } : {}),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setShowCompose(false);
      setSubject("");
      setBody("");
      setTicketId("");
      setRequestType("general");
      const id = (res as { data: { id: string } }).data.id;
      router.push(`/messages?id=${id}`);
      toast.success("toast.messageSent");
    },
    onError: (e) => toast.error(formatApiError(e, t("toast.messageSendFailed"))),
  });

  const sendReply = useMutation({
    mutationFn: () => api.replyMessage(activeId!, reply.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message", activeId] });
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setReply("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resolveThread = useMutation({
    mutationFn: () => api.resolveMessage(activeId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message", activeId] });
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("toast.requestResolved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">{t("messages.title")}</h1>
            <p className="text-muted-foreground">
              {manager ? t("messages.adminSubtitle") : t("messages.techSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm flex items-center gap-1.5 hover:brightness-95"
          >
            <Plus className="size-4" /> New message
          </button>
        </div>

        {showCompose && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
            <h2 className="font-bold mb-4">New message to management</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold mb-1 block">Request type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as StaffMessageRequestType)}
                  className="stackfix-form-input"
                >
                  <option value="general">General question</option>
                  <option value="edit_ticket">Request ticket edit</option>
                  <option value="delete_ticket">Request ticket delete</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="stackfix-form-input"
                  placeholder={t("messages.summaryPlaceholder")}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Ticket number (optional)</label>
                <input
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="stackfix-form-input font-mono text-sm"
                  placeholder="e.g. TKT-0001"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Message</label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="stackfix-form-input"
                  placeholder={t("messages.bodyPlaceholder")}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={createMessage.isPending || subject.trim().length < 3 || body.trim().length < 3}
                  onClick={() => createMessage.mutate()}
                  className="px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm disabled:opacity-60"
                >
                  Send message
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="stackfix-btn-outline px-4 py-2.5 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && <p className="text-muted-foreground">Loading messages…</p>}

        {!isLoading && threads.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <MessageSquare className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">No messages yet.</p>
            <p className="text-sm text-muted-foreground">
              Technicians can request ticket edits or deletions here.
            </p>
          </div>
        )}

        {threads.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-2 max-h-[32rem] overflow-y-auto scrollbar-thin pr-1">
              {manager && openCount > 0 && (
                <p className="text-xs font-semibold text-amber-700 mb-2 sticky top-0 bg-background/90 py-1">
                  {openCount} open request(s)
                </p>
              )}
              {threads.map((t) => {
                const active = t.id === activeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => router.push(`/messages?id=${t.id}`)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      active ? "bg-card border-brand shadow-sm" : "bg-card/50 border-border hover:border-brand/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{t.subject}</p>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0 ${staffMessageStatusBadgeClass(t.status)}`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {t.sender.fullName} · {staffMessageRequestLabel(t.requestType)} ·{" "}
                      {formatRelativeTime(t.createdAt)}
                      {t.replyCount > 0 ? ` · ${t.replyCount} repl${t.replyCount === 1 ? "y" : "ies"}` : ""}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm flex flex-col min-h-[24rem] max-h-[32rem]">
              {threadLoading && <p className="text-muted-foreground p-6">Loading thread…</p>}
              {thread && (
                <>
                  <div className="flex items-start justify-between gap-3 p-5 border-b border-border shrink-0">
                    <div>
                      <h2 className="text-lg font-bold">{thread.subject}</h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {staffMessageRequestLabel(thread.requestType)}
                        {thread.ticket && (
                          <>
                            {" · "}
                            <Link href={`/tickets/${thread.ticket.id}`} className="text-brand font-semibold">
                              #{thread.ticket.ticketNumber}
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    {manager && thread.status === "open" && (
                      <button
                        type="button"
                        onClick={() => resolveThread.mutate()}
                        disabled={resolveThread.isPending}
                        className="stackfix-btn-outline px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0"
                      >
                        <CheckCircle2 className="size-3.5" /> Resolve
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-3">
                    {chatMessages.map((m, index) => (
                      <div key={m.id}>
                        {index === firstNewIndex && <NewMessagesDivider />}
                        <MessageBubble author={m.author} createdAt={m.createdAt} body={m.body} isOwn={m.isOwn} />
                      </div>
                    ))}
                    {typers.length > 0 && (
                      <p className="text-xs text-muted-foreground italic px-1">
                        {typers.length === 1
                          ? `${typers[0]} is typing…`
                          : `${typers.slice(0, 2).join(", ")}${typers.length > 2 ? ` +${typers.length - 2}` : ""} are typing…`}
                      </p>
                    )}
                  </div>

                  {thread.status === "open" ? (
                    <div className="p-4 border-t border-border shrink-0">
                      <ChatComposer
                        value={reply}
                        onChange={setReply}
                        onSend={() => sendReply.mutate()}
                        onTyping={pulseTyping}
                        sending={sendReply.isPending}
                      />
                    </div>
                  ) : (
                    thread.resolvedBy && (
                      <p className="text-xs text-muted-foreground p-4 border-t border-border shrink-0">
                        Resolved by {thread.resolvedBy.fullName}
                        {thread.resolvedAt ? ` · ${formatRelativeTime(thread.resolvedAt)}` : ""}
                      </p>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-8">Loading…</div>
        </AppShell>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
