import type { TicketStatus } from "@prisma/client";
import { formatRWFPlain, ticketStatusLabel } from "@stackfix/utils";

export type BankDetails = {
  name?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
};

/** Customer-facing copy for a repair status — shared by WhatsApp and email. */
export function statusCustomerMessage(
  status: TicketStatus,
  opts: { paymentModel: "pay_before" | "pay_on_pickup"; invoicePaid: boolean },
): string {
  switch (status) {
    case "pending":
      return "We've received your device and added it to our repair queue.";
    case "under_repair":
      return "Good news — our technicians have started working on your device.";
    case "completed":
      return opts.paymentModel === "pay_on_pickup" && !opts.invoicePaid
        ? "Your device is repaired and ready. Please complete payment when you pick it up."
        : "Your device is repaired and ready for pickup.";
    case "picked_up":
      return "Your device has been collected. Thank you for choosing us!";
    case "cancelled":
      return "Your repair request has been cancelled. Please contact us if you have any questions.";
  }
}

function bankLines(bank: BankDetails, reference: string): string[] {
  if (!bank.name || !bank.accountNumber) return [];
  const holder = bank.accountName ? `${bank.name} · ${bank.accountName}` : bank.name;
  return ["", "Or pay by bank transfer:", holder, `Account: ${bank.accountNumber}`, `Reference: ${reference}`];
}

export function buildInvoiceWhatsApp(p: {
  businessName: string;
  businessPhone?: string | null;
  customerName: string;
  invoiceNumber: string;
  deviceDescription: string;
  faultDescription: string;
  amount: number;
  ussdCode?: string | null;
  bank: BankDetails;
}): string {
  const lines = [
    `*${p.businessName}* — Invoice ${p.invoiceNumber}`,
    "",
    `Hi ${p.customerName}, here are the details for your repair:`,
    "",
    `Device: ${p.deviceDescription}`,
    `Issue: ${p.faultDescription}`,
    `*Amount due: RWF ${formatRWFPlain(p.amount)}*`,
  ];
  if (p.ussdCode) {
    lines.push("", "Pay with MTN MoMo — dial:", p.ussdCode);
  }
  lines.push(...bankLines(p.bank, p.invoiceNumber));
  if (p.businessPhone) {
    lines.push("", `Questions? Call us on ${p.businessPhone}.`);
  }
  return lines.join("\n");
}

export function buildStatusWhatsApp(p: {
  businessName: string;
  businessPhone?: string | null;
  customerName: string;
  ticketNumber: string;
  deviceDescription: string;
  status: TicketStatus;
  statusMessage: string;
}): string {
  const lines = [
    `*${p.businessName}*`,
    "",
    `Hi ${p.customerName},`,
    `Your repair *${p.ticketNumber}* (${p.deviceDescription}) is now: *${ticketStatusLabel(p.status)}*.`,
    p.statusMessage,
  ];
  if (p.businessPhone) lines.push("", `Questions? Call us on ${p.businessPhone}.`);
  return lines.join("\n");
}

export function buildPaymentWhatsApp(p: {
  businessName: string;
  businessPhone?: string | null;
  customerName: string;
  invoiceNumber: string;
  amount: number;
}): string {
  const lines = [
    `*${p.businessName}*`,
    "",
    `Hi ${p.customerName},`,
    `We've received your payment of *RWF ${formatRWFPlain(p.amount)}* for invoice ${p.invoiceNumber}. Thank you!`,
  ];
  if (p.businessPhone) lines.push("", `Questions? Call us on ${p.businessPhone}.`);
  return lines.join("\n");
}
