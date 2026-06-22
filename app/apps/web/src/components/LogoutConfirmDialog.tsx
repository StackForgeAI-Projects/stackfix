"use client";

import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ConfirmActionDialog } from "./ConfirmActionDialog";

type LogoutConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

export function LogoutConfirmDialog({ open, onOpenChange, onConfirm }: LogoutConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={t("logout.title")}
      description={t("logout.description")}
      confirmLabel={t("logout.confirm")}
      loadingLabel={t("logout.loading")}
      destructive
      icon={<LogOut className="size-7" strokeWidth={1.75} />}
    />
  );
}
