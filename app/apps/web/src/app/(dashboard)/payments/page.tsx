"use client";

import { AppShell } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatRWFPlain } from "@stackfix/utils";
import { useTranslation } from "react-i18next";

export default function PaymentsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => api.payments(),
  });

  const payments = (data?.data ?? []) as Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    confirmedAt?: string;
    invoice?: { invoiceNumber: string; customer?: { fullName: string } };
  }>;

  return (
    <AppShell>
      <div className="p-8 max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t("payments.title")}</h1>
        {isLoading && <p className="text-muted-foreground">{t("payments.loading")}</p>}
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="bg-card p-5 rounded-2xl border border-border flex justify-between">
              <div>
                <p className="font-bold">{p.invoice?.customer?.fullName ?? t("payments.customerFallback")}</p>
                <p className="text-sm text-muted-foreground">{p.invoice?.invoiceNumber} · {p.paymentMethod}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">RWF {formatRWFPlain(Number(p.amount))}</p>
                <p className="text-xs text-muted-foreground">
                  {p.confirmedAt ? new Date(p.confirmedAt).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>
          ))}
          {!isLoading && payments.length === 0 && (
            <p className="text-muted-foreground">{t("payments.empty")}</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
