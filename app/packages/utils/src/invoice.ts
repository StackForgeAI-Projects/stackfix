export interface InvoiceLineItemInput {
  quantity: number;
  unitPrice: number;
}

export function calculateInvoiceTotals(
  lineItems: InvoiceLineItemInput[],
  vatRatePercent: number,
): {
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
} {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPrice),
    0,
  );
  const vatAmount = Math.round(subtotal * (vatRatePercent / 100));
  const totalAmount = subtotal + vatAmount;
  return { subtotal, vatAmount, totalAmount };
}
