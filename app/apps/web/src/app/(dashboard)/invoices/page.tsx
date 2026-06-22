"use client";

import { AppShell } from "@/components/AppShell";
import { Pager } from "@/components/Pager";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { deviceDisplayName } from "@/lib/ticket-ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { TranslatedPaymentStatusBadge } from "@/components/TranslatedBadges";
import { DynamicText } from "@/components/DynamicText";
import {
  formatRWFPlain,
  formatRelativeTime,
} from "@stackfix/utils";
import { ChevronLeft, Download, Printer, Send } from "lucide-react";
import { toast } from "@/lib/toast";
import { useTranslation } from "react-i18next";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  vatAmount: number;
  ussdCode?: string | null;
  createdAt: string;
  customer: { fullName: string; phone: string };
  ticket: {
    id: string;
    ticketNumber: string;
    deviceType: string;
    deviceBrand?: string | null;
    deviceModel?: string | null;
    faultDescription: string;
  };
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
};

function InvoicesPageContent() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.invoices({ limit: "100" }),
    enabled: !authLoading && !!user,
  });

  const invoices = (data?.data ?? []) as InvoiceRow[];
  const activeInvoice = useMemo(() => {
    if (selectedId) return invoices.find((i) => i.id === selectedId) ?? invoices[0];
    return invoices[0];
  }, [invoices, selectedId]);

  const focused = Boolean(selectedId);
  const start = (page - 1) * pageSize;
  const visible = invoices.slice(start, start + pageSize);

  const sendInvoice = useMutation({
    mutationFn: (id: string) => api.sendInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("toast.invoiceSent");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) => api.markInvoicePaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("toast.invoicePaid");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectInvoice = (id: string | undefined) => {
    if (id) router.push(`/invoices?id=${id}`);
    else router.push("/invoices");
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("invoices.title")}</h1>
            <p className="text-muted-foreground">{t("invoices.subtitle")}</p>
          </div>
          {activeInvoice && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 sm:px-4 py-2.5 bg-card border border-border rounded-xl font-semibold text-sm flex items-center gap-1.5 hover:bg-muted"
              >
                <Printer className="size-4" /> <span className="hidden sm:inline">{t("invoices.print")}</span>
              </button>
              <button
                type="button"
                className="px-3 sm:px-4 py-2.5 bg-card border border-border rounded-xl font-semibold text-sm flex items-center gap-1.5 hover:bg-muted"
                onClick={() => toast.info("toast.pdfComingSoon")}
              >
                <Download className="size-4" /> {t("invoices.pdf")}
              </button>
              <button
                type="button"
                disabled={sendInvoice.isPending || activeInvoice.status === "sent"}
                onClick={() => sendInvoice.mutate(activeInvoice.id)}
                className="px-3 sm:px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm flex items-center gap-1.5 hover:brightness-95 disabled:opacity-60"
              >
                <Send className="size-4" /> <span className="hidden sm:inline">{t("invoices.sendSms")}</span>
              </button>
            </div>
          )}
        </div>

        {focused && (
          <button
            type="button"
            onClick={() => selectInvoice(undefined)}
            className="lg:hidden inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="size-4" /> {t("invoices.allInvoices")}
          </button>
        )}

        {isLoading && <p className="text-muted-foreground">{t("invoices.loading")}</p>}
        {isError && (
          <p className="text-red-600 text-sm mb-4">{t("invoices.loadError")}</p>
        )}

        {!isLoading && !isError && invoices.length === 0 && (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <p className="text-muted-foreground mb-2">{t("invoices.empty")}</p>
            <p className="text-sm text-muted-foreground mb-4">{t("invoices.emptyHint")}</p>
            <Link href="/tickets/new" className="inline-flex px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm">
              {t("nav.newRepair")}
            </Link>
          </div>
        )}

        {invoices.length > 0 && activeInvoice && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className={focused ? "hidden lg:block" : ""}>
              <div className="space-y-2">
                {visible.map((inv) => {
                  const active = inv.id === activeInvoice.id;
                  return (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => selectInvoice(inv.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        active
                          ? "bg-card border-brand shadow-sm"
                          : "bg-card/50 border-border hover:border-brand/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="font-mono text-xs text-muted-foreground truncate">{inv.invoiceNumber}</p>
                        <TranslatedPaymentStatusBadge status={inv.status} />
                      </div>
                      <p className="font-semibold text-sm truncate">{inv.customer.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        RWF {formatRWFPlain(Number(inv.totalAmount))} · {formatRelativeTime(inv.createdAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
              <Pager
                page={page}
                pageSize={pageSize}
                total={invoices.length}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setPageSize(s);
                  setPage(1);
                }}
                options={[5, 10, 20]}
              />
            </div>

            <div className="bg-card rounded-3xl border border-border shadow-sm p-6 sm:p-8 lg:p-10 lg:col-span-2">
              <div className="flex items-start justify-between mb-8 pb-8 border-b border-border gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-1">{t("invoices.invoiceLabel")}</p>
                  <h2 className="text-2xl font-bold tracking-tight">{activeInvoice.invoiceNumber}</h2>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">StackFix Workshop</p>
                  <p className="text-sm font-semibold">KG 11 Ave, Kigali</p>
                  <p className="text-xs text-muted-foreground">+250 788 000 000</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">{t("invoices.billTo")}</p>
                  <p className="font-bold">{activeInvoice.customer.fullName}</p>
                  <p className="text-sm text-muted-foreground">{activeInvoice.customer.phone}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">{t("invoices.device")}</p>
                  <p className="font-bold">{deviceDisplayName(activeInvoice.ticket)}</p>
                  <p className="text-sm text-muted-foreground"><DynamicText text={activeInvoice.ticket.faultDescription} /></p>
                </div>
              </div>

              <table className="w-full mb-8">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="py-2 font-semibold">{t("invoices.item")}</th>
                    <th className="py-2 font-semibold text-center">{t("invoices.qty")}</th>
                    <th className="py-2 font-semibold text-right">{t("invoices.amount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {activeInvoice.lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3">{item.description}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right font-semibold">
                        RWF {formatRWFPlain(Number(item.unitPrice) * Number(item.quantity))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-full sm:w-72 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("invoices.subtotal")}</span>
                    <span className="font-semibold">
                      RWF {formatRWFPlain(Number(activeInvoice.subtotal))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("invoices.vat")}</span>
                    <span className="font-semibold">RWF {formatRWFPlain(Number(activeInvoice.vatAmount))}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-border text-lg font-bold">
                    <span>{t("invoices.total")}</span>
                    <span>RWF {formatRWFPlain(Number(activeInvoice.totalAmount))}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-ink rounded-2xl text-white relative overflow-hidden">
                <div className="absolute -top-10 -right-10 size-40 bg-brand/15 blur-3xl" />
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand mb-2">
                    {t("invoices.payWithMomo")}
                  </p>
                  <p className="text-sm text-white/70 mb-4">{t("invoices.momoHint")}</p>
                  <div className="bg-white/10 rounded-xl p-4 font-mono text-lg sm:text-2xl font-bold text-center break-all">
                    {activeInvoice.ussdCode ?? `*182*8*1*${formatRWFPlain(Number(activeInvoice.totalAmount))}#`}
                  </div>
                  {isAdmin && activeInvoice.status !== "paid" && (
                    <button
                      type="button"
                      disabled={markPaid.isPending}
                      onClick={() => markPaid.mutate(activeInvoice.id)}
                      className="mt-6 w-full py-3 bg-brand text-ink font-bold rounded-xl hover:brightness-95 disabled:opacity-60"
                    >
                      {markPaid.isPending ? t("invoices.processing") : t("invoices.markPaidCash")}
                    </button>
                  )}
                  {activeInvoice.status === "paid" && (
                    <p className="mt-6 text-center text-sm font-semibold text-brand">{t("invoices.paymentReceived")}</p>
                  )}
                </div>
              </div>

              <Link
                href={`/tickets/${activeInvoice.ticket.id}`}
                className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="size-4" /> {t("invoices.backToTicket")} {activeInvoice.ticket.ticketNumber}
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="p-8">Loading…</div>
      </AppShell>
    }>
      <InvoicesPageContent />
    </Suspense>
  );
}
