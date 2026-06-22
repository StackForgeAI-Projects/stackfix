import type { TicketStatus } from "@prisma/client";
import { formatRWFPlain, ticketStatusLabel } from "@stackfix/utils";
import type { BankDetails } from "./customer-messages.js";

export type CustomerEmailContent = { subject: string; html: string; text: string };

const PAGE_BG = "#f3f4f6";
const HEADER_BG = "#0d1f12";
const BRAND = "#00b341";

type Row = { label: string; value: string };

type ShellParams = {
  businessName: string;
  businessAddress?: string | null;
  logoUrl?: string;
  preheader: string;
  heading: string;
  introHtml: string;
  bodyHtml: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(p: ShellParams): string {
  const logo = p.logoUrl
    ? `<img src="${p.logoUrl}" alt="${escapeHtml(p.businessName)}" width="48" height="48" style="display:block;margin:0 auto 12px;border-radius:12px;" />`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(p.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(p.preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${PAGE_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;background:${HEADER_BG};">
              ${logo}
              <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">${escapeHtml(p.businessName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#111827;font-weight:700;">${escapeHtml(p.heading)}</h1>
              <div style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">${p.introHtml}</div>
              ${p.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#6b7280;text-align:center;">
                <strong style="color:#374151;">${escapeHtml(p.businessName)}</strong>${
                  p.businessAddress ? `<br />${escapeHtml(p.businessAddress)}` : ""
                }
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">
                Sent by StackFix on behalf of ${escapeHtml(p.businessName)}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailCard(rows: Row[]): string {
  const body = rows
    .map(
      (r) => `<tr>
        <td style="padding:10px 0;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${escapeHtml(r.label)}</td>
        <td style="padding:10px 0;font-size:13px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${escapeHtml(r.value)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;border:1px solid #e5e7eb;border-radius:12px;padding:4px 16px;">${body}</table>`;
}

function amountBox(label: string, amount: number): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;background:${HEADER_BG};border-radius:12px;">
    <tr><td style="padding:18px 20px;">
      <span style="font-size:13px;color:#9ca3af;">${escapeHtml(label)}</span>
      <span style="float:right;font-size:20px;font-weight:800;color:#ffffff;">RWF ${formatRWFPlain(amount)}</span>
    </td></tr>
  </table>`;
}

function ussdBox(code: string): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;background:#f0fdf4;border:2px solid ${BRAND};border-radius:12px;">
    <tr><td style="padding:16px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;color:#15803d;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">Pay with MTN MoMo — dial</p>
      <p style="margin:0;font-size:20px;font-weight:800;font-family:'SFMono-Regular',Consolas,monospace;color:#007a2e;">${escapeHtml(code)}</p>
    </td></tr>
  </table>`;
}

function bankBox(bank: BankDetails, reference: string): string {
  if (!bank.name || !bank.accountNumber) return "";
  const holder = bank.accountName ? `${bank.name} · ${bank.accountName}` : bank.name;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;">
    <tr><td style="padding:16px;">
      <p style="margin:0 0 6px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">Or pay by bank transfer</p>
      <p style="margin:0 0 2px;font-size:14px;color:#111827;font-weight:600;">${escapeHtml(holder)}</p>
      <p style="margin:0;font-size:13px;color:#4b5563;">Account: ${escapeHtml(bank.accountNumber)}<br />Reference: ${escapeHtml(reference)}</p>
    </td></tr>
  </table>`;
}

export function buildInvoiceEmail(p: {
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  logoUrl?: string;
  customerName: string;
  invoiceNumber: string;
  deviceDescription: string;
  faultDescription: string;
  amount: number;
  ussdCode?: string | null;
  bank: BankDetails;
}): CustomerEmailContent {
  const bodyHtml =
    detailCard([
      { label: "Invoice", value: p.invoiceNumber },
      { label: "Device", value: p.deviceDescription },
      { label: "Issue", value: p.faultDescription },
    ]) +
    amountBox("Amount due", p.amount) +
    (p.ussdCode ? ussdBox(p.ussdCode) : "") +
    bankBox(p.bank, p.invoiceNumber);

  const html = shell({
    businessName: p.businessName,
    businessAddress: p.businessAddress,
    logoUrl: p.logoUrl,
    preheader: `Invoice ${p.invoiceNumber} — RWF ${formatRWFPlain(p.amount)}`,
    heading: `Invoice ${p.invoiceNumber}`,
    introHtml: `Hi ${escapeHtml(p.customerName)},<br />Here are the details for your repair and how to pay.`,
    bodyHtml,
  });

  const textLines = [
    `Invoice ${p.invoiceNumber} from ${p.businessName}`,
    "",
    `Device: ${p.deviceDescription}`,
    `Issue: ${p.faultDescription}`,
    `Amount due: RWF ${formatRWFPlain(p.amount)}`,
  ];
  if (p.ussdCode) textLines.push("", `Pay with MTN MoMo — dial: ${p.ussdCode}`);
  if (p.bank.name && p.bank.accountNumber) {
    const holder = p.bank.accountName ? `${p.bank.name} · ${p.bank.accountName}` : p.bank.name;
    textLines.push("", "Or pay by bank transfer:", holder, `Account: ${p.bank.accountNumber}`, `Reference: ${p.invoiceNumber}`);
  }

  return {
    subject: `Invoice ${p.invoiceNumber} from ${p.businessName}`,
    html,
    text: textLines.join("\n"),
  };
}

export function buildStatusEmail(p: {
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  logoUrl?: string;
  customerName: string;
  ticketNumber: string;
  deviceDescription: string;
  status: TicketStatus;
  statusMessage: string;
}): CustomerEmailContent {
  const label = ticketStatusLabel(p.status);
  const bodyHtml =
    detailCard([
      { label: "Repair", value: p.ticketNumber },
      { label: "Device", value: p.deviceDescription },
      { label: "Status", value: label },
    ]) +
    `<p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">${escapeHtml(p.statusMessage)}</p>`;

  const html = shell({
    businessName: p.businessName,
    businessAddress: p.businessAddress,
    logoUrl: p.logoUrl,
    preheader: `${p.ticketNumber} is now ${label}`,
    heading: `Repair update: ${label}`,
    introHtml: `Hi ${escapeHtml(p.customerName)},<br />There's an update on your repair <strong>${escapeHtml(p.ticketNumber)}</strong>.`,
    bodyHtml,
  });

  return {
    subject: `${p.businessName}: your repair ${p.ticketNumber} is now ${label}`,
    html,
    text: `${p.businessName}\n\nHi ${p.customerName},\nYour repair ${p.ticketNumber} (${p.deviceDescription}) is now: ${label}.\n${p.statusMessage}`,
  };
}

export function buildPaymentEmail(p: {
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  logoUrl?: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
}): CustomerEmailContent {
  const bodyHtml =
    amountBox("Amount received", p.amount) +
    detailCard([{ label: "Invoice", value: p.invoiceNumber }]) +
    `<p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">Thank you — your payment has been received in full.</p>`;

  const html = shell({
    businessName: p.businessName,
    businessAddress: p.businessAddress,
    logoUrl: p.logoUrl,
    preheader: `Payment received for invoice ${p.invoiceNumber}`,
    heading: "Payment received",
    introHtml: `Hi ${escapeHtml(p.customerName)},<br />We've received your payment. Here's your receipt.`,
    bodyHtml,
  });

  return {
    subject: `${p.businessName}: payment received for invoice ${p.invoiceNumber}`,
    html,
    text: `${p.businessName}\n\nHi ${p.customerName},\nWe've received your payment of RWF ${formatRWFPlain(p.amount)} for invoice ${p.invoiceNumber}. Thank you!`,
  };
}
