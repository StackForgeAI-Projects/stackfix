"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type FormAlertVariant = "success" | "error";

const styles: Record<FormAlertVariant, string> = {
  success:
    "border-primary/35 bg-primary/10 text-foreground [&_button]:text-primary hover:[&_button]:text-primary/80",
  error:
    "border-destructive/40 bg-destructive/10 text-foreground [&_button]:text-destructive hover:[&_button]:text-destructive/80",
};

export function FormAlert({
  variant,
  message,
  onDismiss,
  className,
}: {
  variant: FormAlertVariant;
  message: string;
  onDismiss: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed",
        styles[variant],
        className,
      )}
    >
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="focus-visible:ring-primary/70 shrink-0 rounded-md p-1 transition focus:outline-none focus-visible:ring-2"
        aria-label="Dismiss message"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
