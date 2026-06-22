"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@stackfix/ui";

export type ConfirmActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  icon?: ReactNode;
  destructive?: boolean;
  confirmDisabled?: boolean;
};

/** Standard StackFix confirmation modal — same shell as logout; only content changes. */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loadingLabel,
  icon,
  destructive = false,
  confirmDisabled = false,
}: ConfirmActionDialogProps) {
  const [loading, setLoading] = useState(false);
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (open) openedAtRef.current = Date.now();
  }, [open]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Caller shows toast via mutation onError — keep modal open, no runtime overlay.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next);
      }}
    >
      <DialogContent
        className="stackfix-logout-dialog stackfix-confirm-dialog gap-0 overflow-hidden border-0 p-0 shadow-2xl [&>button.absolute]:hidden"
        onInteractOutside={(event) => {
          if (Date.now() - openedAtRef.current < 250) {
            event.preventDefault();
          }
        }}
      >
        <div className="flex flex-col items-center px-6 pt-8 pb-4 text-center">
          {icon && (
            <div
              className={`mb-5 flex size-14 items-center justify-center rounded-2xl ${
                destructive ? "bg-red-500/10 text-red-600" : "bg-brand/10 text-brand"
              }`}
              aria-hidden
            >
              {icon}
            </div>
          )}
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-xl font-bold text-foreground">{title}</DialogTitle>
            <DialogDescription className="stackfix-logout-dialog-desc text-sm leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="gap-3 border-t border-border/60 bg-muted/20 p-4 sm:justify-stretch">
          <button
            type="button"
            className="stackfix-btn-outline h-11 flex-1 rounded-xl text-sm shadow-sm"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`h-11 flex-1 rounded-xl text-sm shadow-sm font-semibold disabled:opacity-50 ${
              destructive ? "stackfix-btn-destructive" : "bg-brand text-ink hover:brightness-95"
            }`}
            disabled={loading || confirmDisabled}
            onClick={() => void handleConfirm()}
          >
            {loading ? (loadingLabel ?? `${confirmLabel}…`) : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
