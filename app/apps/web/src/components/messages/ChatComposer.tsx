"use client";

import { useEffect, useRef } from "react";
import { formatMessageTimestamp } from "@stackfix/utils";
import { useTranslation } from "react-i18next";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping?: () => void;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
};

export function ChatComposer({
  value,
  onChange,
  onSend,
  onTyping,
  disabled,
  sending,
  placeholder = "Write a reply…",
}: ChatComposerProps) {
  const canSend = !disabled && !sending && value.trim().length > 0;
  const lastTypingRef = useRef(0);

  useEffect(() => {
    if (!onTyping || !value.trim()) return;
    const now = Date.now();
    if (now - lastTypingRef.current < 1200) return;
    lastTypingRef.current = now;
    onTyping();
  }, [value, onTyping]);

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/30 p-2 focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10">
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder={placeholder}
        disabled={disabled || sending}
        className="flex-1 resize-none bg-transparent border-0 px-2 py-2 text-sm outline-none placeholder:text-muted-foreground min-h-[2.75rem] max-h-32"
      />
      <button
        type="button"
        disabled={!canSend}
        onClick={onSend}
        aria-label="Send message"
        className="mb-0.5 size-10 shrink-0 grid place-items-center rounded-xl bg-brand text-ink shadow-sm transition-all hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <path d="M3.4 20.6 22 12 3.4 3.4l1.8 7.2L16 12l-10.8 1.4-1.8 7.2z" />
        </svg>
      </button>
    </div>
  );
}

type MessageBubbleProps = {
  author: string;
  createdAt: string;
  body: string;
  isOwn?: boolean;
};

export function NewMessagesDivider() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-brand/40" />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">{t("messages.newDivider")}</span>
      <div className="flex-1 h-px bg-brand/40" />
    </div>
  );
}

export function MessageBubble({ author, createdAt, body, isOwn }: MessageBubbleProps) {
  const timestamp = formatMessageTimestamp(createdAt);

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isOwn
            ? "bg-brand text-ink rounded-br-md"
            : "bg-muted/60 border border-border rounded-bl-md"
        }`}
      >
        <p className={`text-xs font-semibold mb-1.5 ${isOwn ? "text-ink/80" : "text-foreground"}`}>
          {author}
        </p>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{body}</p>
      </div>
      <time
        dateTime={createdAt}
        className={`text-[11px] text-muted-foreground mt-1 px-1 ${isOwn ? "text-right" : "text-left"}`}
      >
        {timestamp}
      </time>
    </div>
  );
}
