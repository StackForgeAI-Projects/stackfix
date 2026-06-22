"use client";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { deviceDisplayName } from "@/lib/ticket-ui";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { TranslatedStatusBadge, TranslatedPaymentStatusBadge } from "@/components/TranslatedBadges";
import { DynamicText } from "@/components/DynamicText";
import { RelativeTime } from "@/components/RelativeTime";
import { translateStatusReason } from "@/lib/format-i18n";
import type { TicketStatus } from "@stackfix/types";
import {
  formatRWFPlain,
  getAllowedNextStatuses,
  TICKET_STATUS_OPTIONS,
  ticketStatusUnavailableReason,
  canAccessFinancials,
  canCreateInvoice,
  canDeleteTicket,
  canEditTicket,
  canUpdateTicketStatus,
  isSuperAdmin,
} from "@stackfix/utils";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { TicketEditPanel } from "@/components/tickets/TicketEditPanel";

type TicketDetail = {
  id: string;
  ticketNumber: string;
  status: TicketStatus;
  deviceType: string;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  faultDescription: string;
  internalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { fullName: string; phone: string; email?: string | null };
  priority?: string;
  technician?: { id: string; fullName: string } | null;
  createdBy?: { fullName: string } | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    ussdCode?: string | null;
    subtotalAmount?: number;
    vatAmount?: number;
  } | null;
  statusHistory: Array<{ toStatus: TicketStatus; createdAt: string }>;
  notes: Array<{ body: string; createdAt: string; user: { fullName: string } }>;
};

export default function TicketDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const role = user?.role ?? "technician";
  const canUpdateStatus = canUpdateTicketStatus(role);
  const canEdit = canEditTicket(role);
  const showFinancials = canAccessFinancials(role);
  const canRaiseInvoice = canCreateInvoice(role);
  const isOwner = isSuperAdmin(role);

  const [editing, setEditing] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>("pending");
  const [note, setNote] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [showRaiseInvoice, setShowRaiseInvoice] = useState(false);
  const [deleteTicketOpen, setDeleteTicketOpen] = useState(false);
  const [deleteInvoiceOpen, setDeleteInvoiceOpen] = useState(false);

  const { data: orgData } = useQuery({
    queryKey: ["org"],
    queryFn: () => api.org(),
    enabled: !authLoading && !!user,
  });
  const org = orgData?.data as { paymentModel?: "pay_before" | "pay_on_pickup" } | undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => api.ticket(id),
    enabled: !authLoading && !!user && !!id,
  });

  const ticket = data?.data as TicketDetail | undefined;

  useEffect(() => {
    if (ticket) setSelectedStatus(ticket.status);
  }, [ticket?.status, ticket]);

  const updateStatus = useMutation({
    mutationFn: async ({ status, noteText }: { status: TicketStatus; noteText?: string }) => {
      if (noteText?.trim()) {
        await api.addTicketNote(id, noteText.trim());
      }
      if (status !== ticket?.status) {
        return api.updateTicketStatus(id, status);
      }
      return null;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      setNote("");
      toast.success("toast.statusUpdated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTicket = useMutation({
    mutationFn: () => api.deleteTicket(id),
    onSuccess: () => {
      qc.setQueriesData(
        { queryKey: ["tickets"] },
        (old: { data?: Array<{ id: string }> } | undefined) => {
          if (!old?.data) return old;
          return { ...old, data: old.data.filter((t) => t.id !== id) };
        },
      );
      qc.removeQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("toast.ticketDeleted");
      router.replace("/tickets");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteInvoice = useMutation({
    mutationFn: () => api.deleteInvoice(ticket!.invoice!.id),
    onSuccess: () => {
      qc.setQueryData(
        ["ticket", id],
        (old: { data: TicketDetail } | undefined) => {
          if (!old?.data) return old;
          return { ...old, data: { ...old.data, invoice: null } };
        },
      );
      qc.setQueriesData(
        { queryKey: ["tickets"] },
        (old: { data?: Array<{ id: string; invoice?: unknown }> } | undefined) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((t) => (t.id === id ? { ...t, invoice: null } : t)),
          };
        },
      );
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("toast.invoiceDeleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const raiseInvoice = useMutation({
    mutationFn: async (amount: number) => {
      const part = Math.round(amount * 0.8);
      const labor = amount - part;
      return api.createInvoice({
        ticketId: id,
        lineItems: [
          {
            description: ticket!.faultDescription,
            quantity: 1,
            unitPrice: part,
            itemType: "part",
          },
          {
            description: "Labor & diagnostics",
            quantity: 1,
            unitPrice: labor,
            itemType: "labour",
          },
        ],
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["ticket", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setShowRaiseInvoice(false);
      setInvoiceAmount("");
      toast.success("toast.invoiceCreated");
      const invoiceId = (res as { data: { id: string } }).data.id;
      router.push(`/invoices?id=${invoiceId}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (authLoading || isLoading) {
    return (
      <AppShell>
        <div className="p-8">{t("common.loading")}</div>
      </AppShell>
    );
  }

  if (isError || !ticket) {
    return (
      <AppShell>
        <div className="p-12 text-center">
          <p className="text-muted-foreground">{t("tickets.notFound")}</p>
          <Link href="/tickets" className="text-brand font-semibold text-sm mt-4 inline-block">
            {t("tickets.back")}
          </Link>
        </div>
      </AppShell>
    );
  }

  const allowedStatuses = getAllowedNextStatuses(ticket.status, role);
  const selectableStatuses = TICKET_STATUS_OPTIONS;
  const invoicePaid = ticket.invoice?.status === "paid";
  const hasUnpaidInvoice = !!ticket.invoice && !invoicePaid;
  const statusHint = translateStatusReason(
    t,
    ticketStatusUnavailableReason(ticket.status, selectedStatus, {
      paymentModel: org?.paymentModel,
      invoicePaid,
      hasInvoice: !!ticket.invoice,
    }),
  );
  const completedEntry = ticket.statusHistory.find((h) => h.toStatus === "completed");
  const diagnosticNote =
    ticket.notes[0]?.body ??
    ticket.internalNotes ??
    t("tickets.diagnosticPlaceholder");

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="size-4" /> Back
        </Link>

        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-mono text-muted-foreground">TICKET ID</p>
            <h1 className="text-2xl font-bold tracking-tight">#{ticket.ticketNumber}</h1>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="px-3 py-2 rounded-xl border border-border text-xs font-semibold flex items-center gap-1.5 hover:bg-muted"
              >
                <Pencil className="size-3.5" /> Edit ticket
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={() => setDeleteTicketOpen(true)}
                className="size-10 grid place-items-center rounded-xl border border-border text-muted-foreground hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                aria-label="Delete ticket"
              >
                <Trash2 className="size-4" />
              </button>
            )}
            <TranslatedStatusBadge status={ticket.status} size="lg" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {editing && canEdit && (
              <TicketEditPanel
                ticketId={id}
                ticket={ticket}
                onCancel={() => setEditing(false)}
                onSaved={() => setEditing(false)}
              />
            )}

            {!editing && (
            <>
            <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Customer Information
              </h3>
              <h4 className="text-lg font-bold mb-3">{ticket.customer.fullName}</h4>
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-brand shrink-0" /> {ticket.customer.phone}
                </p>
                {ticket.customer.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 text-brand shrink-0" /> {ticket.customer.email}
                  </p>
                )}
                {ticket.createdBy?.fullName && (
                  <p className="text-muted-foreground">Created by {ticket.createdBy.fullName}</p>
                )}
              </div>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Device Information
              </h3>
              <p className="text-sm font-semibold">{deviceDisplayName(ticket)}</p>
              <p className="text-sm text-muted-foreground mb-4"><DynamicText text={ticket.faultDescription} /></p>
              <div className="bg-muted/50 rounded-xl p-3 text-sm border border-border"><DynamicText text={diagnosticNote} as="p" /></div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Calendar className="size-3.5 shrink-0" /> {t("tickets.received")}: <RelativeTime date={ticket.createdAt} />
                </p>
                {ticket.status === "completed" && completedEntry && (
                  <p className="flex items-center gap-2 text-brand">
                    <CheckCircle2 className="size-3.5 shrink-0" /> {t("tickets.completed")} <RelativeTime date={completedEntry.createdAt} />
                  </p>
                )}
              </div>
            </section>

            {canUpdateStatus && !canEdit ? (
              <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Update Repair Status
                </h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Workflow: Pending → Under Repair → Completed → Picked Up. Completed and Picked Up unlock as you
                  progress. Payment may be required depending on your workshop payment model.
                </p>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TicketStatus)}
                  className="stackfix-form-input font-semibold mb-2"
                >
                  {selectableStatuses.map((s) => {
                    const reason = ticketStatusUnavailableReason(ticket.status, s, {
                      paymentModel: org?.paymentModel,
                      invoicePaid,
                      hasInvoice: !!ticket.invoice,
                    });
                    const disabled = !allowedStatuses.includes(s) && s !== ticket.status;
                    return (
                      <option key={s} value={s} disabled={disabled}>
                        {t(`status.ticket.${s}`)}
                        {disabled && reason ? ` (${reason})` : disabled ? " (unavailable)" : ""}
                      </option>
                    );
                  })}
                </select>
                {statusHint && selectedStatus !== ticket.status && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                    {statusHint}
                  </p>
                )}
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("tickets.addNotesPlaceholder")}
                  className="stackfix-form-input mb-3 resize-y min-h-[80px]"
                />
                <button
                  type="button"
                  disabled={updateStatus.isPending || selectedStatus === ticket.status}
                  onClick={() =>
                    updateStatus.mutate({ status: selectedStatus, noteText: note || undefined })
                  }
                  className="w-full py-3 bg-brand text-ink font-bold rounded-xl hover:brightness-95 transition-all disabled:opacity-60"
                >
                  {updateStatus.isPending ? "Updating…" : "Update Status & Notify Customer"}
                </button>
              </section>
            ) : !canEdit && !canUpdateStatus ? (
              <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Repair Status
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your role has read-only access. Request an edit or delete from management via Messages.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/messages?compose=edit&ticketId=${ticket.id}&ticketNumber=${ticket.ticketNumber}`}
                    className="px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Request edit
                  </Link>
                  <Link
                    href={`/messages?compose=delete&ticketId=${ticket.id}&ticketNumber=${ticket.ticketNumber}`}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50"
                  >
                    Request delete
                  </Link>
                </div>
              </section>
            ) : null}
            </>
            )}
          </div>

          <div className="space-y-6">
          {showFinancials && (
            <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment</h3>
                {isOwner && ticket.invoice && ticket.invoice.status !== "paid" && (
                  <button
                    type="button"
                    onClick={() => setDeleteInvoiceOpen(true)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Delete invoice
                  </button>
                )}
              </div>
              {ticket.invoice ? (
                <>
                  <p className="text-3xl font-bold tracking-tight">
                    RWF {formatRWFPlain(Number(ticket.invoice.totalAmount))}
                  </p>
                  <TranslatedPaymentStatusBadge status={ticket.invoice.status} size="lg" className="mt-2" />
                  {ticket.invoice.ussdCode && (
                    <p className="font-mono text-xs text-brand mt-3 break-all">{ticket.invoice.ussdCode}</p>
                  )}
                  <Link
                    href={`/invoices?id=${ticket.invoice.id}`}
                    className="mt-4 block text-center w-full py-2.5 bg-ink text-white rounded-xl font-semibold text-sm hover:bg-ink/90 transition-colors"
                  >
                    View Invoice
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    No invoice yet. Raise an invoice to send payment details to the customer.
                  </p>
                  {!showRaiseInvoice ? (
                    canRaiseInvoice && (
                      <button
                        type="button"
                        onClick={() => setShowRaiseInvoice(true)}
                        className="w-full py-2.5 bg-ink text-white rounded-xl font-semibold text-sm hover:bg-ink/90 transition-colors"
                      >
                        Raise Invoice
                      </button>
                    )
                  ) : (
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Total amount (RWF)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        placeholder="e.g. 120000"
                        className="stackfix-form-input"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRaiseInvoice(false)}
                          className="flex-1 py-2.5 border border-border rounded-xl font-semibold text-sm hover:bg-muted"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={raiseInvoice.isPending || !invoiceAmount || Number(invoiceAmount) <= 0}
                          onClick={() => raiseInvoice.mutate(Number(invoiceAmount))}
                          className="flex-1 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm hover:brightness-95 disabled:opacity-60"
                        >
                          {raiseInvoice.isPending ? "Creating…" : "Create Invoice"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

            <section className="bg-ink text-white rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 size-32 bg-brand/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-brand" />
                  <h3 className="font-semibold text-sm">AI Summary</h3>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Likely repair for {deviceDisplayName(ticket)}. Parts availability and MoMo payment patterns will
                  appear here in Phase 5 AI integration.
                </p>
              </div>
            </section>

            <section className="bg-card rounded-2xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="size-4 text-brand" />
                <h3 className="font-semibold text-sm">Notifications sent</h3>
              </div>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>{t("tickets.smsTicketCreated")} · <RelativeTime date={ticket.createdAt} /></li>
                {ticket.statusHistory.slice(1).map((h, i) => (
                  <li key={i}>
                    {t("tickets.statusChange", { status: t(`status.ticket.${h.toStatus}`) })} · <RelativeTime date={h.createdAt} />
                  </li>
                ))}
                {ticket.statusHistory.length <= 1 && <li>WhatsApp: Awaiting status updates</li>}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <ConfirmActionDialog
        open={deleteTicketOpen}
        onOpenChange={setDeleteTicketOpen}
        onConfirm={async () => {
          await deleteTicket.mutateAsync();
        }}
        title={t("tickets.deleteTitle")}
        description={
          invoicePaid
            ? t("tickets.deletePaidHint")
            : hasUnpaidInvoice
              ? t("tickets.deleteWithInvoice")
              : t("tickets.deleteConfirm")
        }
        confirmLabel={t("tickets.deleteAction")}
        loadingLabel={t("team.deleting")}
        confirmDisabled={invoicePaid}
        destructive
        icon={<Trash2 className="size-7" strokeWidth={1.75} />}
      />

      <ConfirmActionDialog
        open={deleteInvoiceOpen}
        onOpenChange={setDeleteInvoiceOpen}
        onConfirm={async () => {
          await deleteInvoice.mutateAsync();
        }}
        title={t("tickets.deleteInvoiceTitle")}
        description={t("tickets.deleteInvoiceHint")}
        confirmLabel={t("tickets.deleteInvoiceAction")}
        loadingLabel={t("team.deleting")}
        destructive
        icon={<Trash2 className="size-7" strokeWidth={1.75} />}
      />
    </AppShell>
  );
}
