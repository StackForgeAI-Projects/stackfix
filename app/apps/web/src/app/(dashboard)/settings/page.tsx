"use client";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api";
import { setAppLanguage } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { APP_LANGUAGES, isSuperAdmin, type AppLanguage } from "@stackfix/utils";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user ? isSuperAdmin(user.role) : false;
  const { data } = useQuery({ queryKey: ["org"], queryFn: () => api.org() });
  const org = data?.data as {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    paymentModel: string;
    defaultVatRate: number;
    language: string;
    rdbNumber?: string;
    bankName?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
  } | undefined;

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.updateOrg(body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["org"] });
      const lang = variables.language as AppLanguage | undefined;
      if (lang) setAppLanguage(lang);
      toast.success("settings.saved");
    },
    onError: (e: Error) => toast.error(formatApiError(e)),
  });

  if (!org) {
    return (
      <AppShell>
        <div className="p-8">{t("common.loading")}</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">{t("settings.title")}</h1>
        <p className="text-muted-foreground mb-6">{t("settings.subtitle")}</p>
        <form
          className="space-y-4 bg-card p-6 rounded-2xl border border-border"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const lang = fd.get("language") as AppLanguage;
            if (!canEdit) {
              setAppLanguage(lang);
              toast.success("settings.saved");
              return;
            }
            update.mutate({
              name: fd.get("name"),
              address: fd.get("address"),
              phone: fd.get("phone"),
              email: fd.get("email"),
              paymentModel: fd.get("paymentModel"),
              language: lang,
              rdbNumber: fd.get("rdbNumber"),
              bankName: fd.get("bankName"),
              bankAccountName: fd.get("bankAccountName"),
              bankAccountNumber: fd.get("bankAccountNumber"),
            });
          }}
        >
          <Field label={t("settings.businessName")} name="name" defaultValue={org.name} readOnly={!canEdit} />
          <Field label={t("settings.address")} name="address" defaultValue={org.address ?? ""} readOnly={!canEdit} />
          <Field label={t("settings.phone")} name="phone" defaultValue={org.phone ?? ""} readOnly={!canEdit} />
          <Field label={t("settings.email")} name="email" defaultValue={org.email ?? ""} readOnly={!canEdit} />
          <Field label={t("settings.rdbNumber")} name="rdbNumber" defaultValue={org.rdbNumber ?? ""} readOnly={!canEdit} />
          {canEdit && (
            <div>
              <label className="text-sm font-semibold mb-1 block">{t("settings.paymentModel")}</label>
              <select name="paymentModel" defaultValue={org.paymentModel} className="stackfix-form-input">
                <option value="pay_on_pickup">{t("settings.payOnPickup")}</option>
                <option value="pay_before">{t("settings.payBefore")}</option>
              </select>
            </div>
          )}
          {canEdit && (
            <div className="pt-2 border-t border-border space-y-4">
              <div>
                <h2 className="text-sm font-bold">{t("settings.bankSection")}</h2>
                <p className="text-xs text-muted-foreground">{t("settings.bankSectionHint")}</p>
              </div>
              <Field label={t("settings.bankName")} name="bankName" defaultValue={org.bankName ?? ""} />
              <Field label={t("settings.bankAccountName")} name="bankAccountName" defaultValue={org.bankAccountName ?? ""} />
              <Field label={t("settings.bankAccountNumber")} name="bankAccountNumber" defaultValue={org.bankAccountNumber ?? ""} />
            </div>
          )}
          <div>
            <label className="text-sm font-semibold mb-1 block">{t("settings.language")}</label>
            <p className="text-xs text-muted-foreground mb-2">{t("settings.languageHint")}</p>
            <select name="language" defaultValue={org.language} className="stackfix-form-input">
              {APP_LANGUAGES.map(({ code, labelKey }) => (
                <option key={code} value={code}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={update.isPending}
            className="px-4 py-2.5 bg-brand text-ink font-bold rounded-xl w-full sm:w-auto disabled:opacity-60"
          >
            {update.isPending ? t("common.loading") : t("settings.save")}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  name,
  defaultValue,
  readOnly,
}: {
  label: string;
  name: string;
  defaultValue: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1 block">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        readOnly={readOnly}
        className={`stackfix-form-input ${readOnly ? "bg-muted/50 cursor-not-allowed" : ""}`}
      />
    </div>
  );
}
