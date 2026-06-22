/** Payment display helpers — matches stackfix-main-ui-design */

export function isInvoicePaid(status: string): boolean {
  return status === "paid";
}

/** Display label for invoice payment state */
export function paymentStatusLabel(status: string): string {
  if (status === "paid") return "Paid";
  if (status === "partially_paid") return "Partial";
  if (status === "overdue") return "Overdue";
  if (status === "cancelled") return "Cancelled";
  return "Unpaid";
}

export function paymentStatusColor(status: string): string {
  if (status === "paid") return "text-emerald-600";
  if (status === "partially_paid") return "text-blue-600";
  if (status === "overdue") return "text-red-600";
  if (status === "cancelled") return "text-slate-500";
  return "text-amber-700";
}

/** Pill badge classes — explicit CSS in packages/ui globals */
export function paymentStatusBadgeClass(status: string): string {
  if (status === "paid") return "payment-badge-paid";
  if (status === "partially_paid") return "payment-badge-partial";
  if (status === "overdue") return "payment-badge-overdue";
  if (status === "cancelled") return "payment-badge-cancelled";
  return "payment-badge-unpaid";
}
