import type { InvoiceData } from "./types";

/**
 * Branded invoice HTML template — SOP v1.0 §1.5
 * Rendered server-side via Puppeteer for PDF generation.
 */
export function renderInvoiceHtml(invoice: InvoiceData): string {
  const lineRows = invoice.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #E5E7EB">${escapeHtml(item.description)}</td>
        <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right">RWF ${formatNum(item.unitPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right">RWF ${formatNum(item.totalPrice)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    body { font-family: Inter, sans-serif; color: #111827; margin: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand-badge { background: #00B341; color: white; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; }
    .ussd-box { background: #F0FDF4; border: 2px solid #00B341; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center; }
    .ussd-code { font-size: 20px; font-weight: 800; font-family: monospace; color: #007A2E; }
    .total { color: #00B341; font-size: 24px; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { text-align: left; padding: 8px; background: #F9FAFB; font-size: 12px; text-transform: uppercase; }
    .footer { margin-top: 40px; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${invoice.logoUrl ? `<img src="${escapeHtml(invoice.logoUrl)}" alt="Logo" height="48" />` : `<h2>${escapeHtml(invoice.businessName)}</h2>`}
      <p style="color:#6B7280;margin-top:8px">${escapeHtml(invoice.businessAddress ?? "")}</p>
    </div>
    <div style="text-align:right">
      <span class="brand-badge">Powered by StackFix</span>
      <p style="margin-top:12px;font-weight:700">INVOICE</p>
      <p>${escapeHtml(invoice.invoiceNumber)}</p>
      <p style="color:#6B7280">${escapeHtml(invoice.date)}</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
    <div>
      <p style="font-size:12px;color:#6B7280;text-transform:uppercase">Bill To</p>
      <p style="font-weight:600">${escapeHtml(invoice.customerName)}</p>
      <p>${escapeHtml(invoice.customerPhone)}</p>
    </div>
    <div>
      <p style="font-size:12px;color:#6B7280;text-transform:uppercase">Device</p>
      <p style="font-weight:600">${escapeHtml(invoice.deviceDescription)}</p>
      <p style="color:#6B7280">${escapeHtml(invoice.faultDescription)}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div style="text-align:right;margin-top:16px">
    <p>Subtotal: RWF ${formatNum(invoice.subtotal)}</p>
    <p>VAT (${invoice.vatRate}%): RWF ${formatNum(invoice.vatAmount)}</p>
    <p class="total">Grand Total: RWF ${formatNum(invoice.totalAmount)}</p>
  </div>

  ${
    invoice.ussdCode
      ? `<div class="ussd-box">
    <p style="font-weight:600;margin-bottom:8px">Pay via MTN Mobile Money</p>
    <p class="ussd-code">${escapeHtml(invoice.ussdCode)}</p>
    <p style="font-size:13px;margin-top:8px">Dial the code above and confirm with your MoMo PIN.</p>
    <p style="font-size:13px;margin-top:4px">Kanda kode hejuru ukoreshe PIN ya MoMo.</p>
  </div>`
      : ""
  }

  <div class="footer">
    <p>${escapeHtml(invoice.businessName)} · ${escapeHtml(invoice.businessPhone ?? "")} · ${escapeHtml(invoice.businessEmail ?? "")}</p>
    ${invoice.rdbNumber ? `<p>RDB: ${escapeHtml(invoice.rdbNumber)}</p>` : ""}
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNum(n: number): string {
  return new Intl.NumberFormat("en-RW").format(n);
}
