export interface InvoiceLineItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  rdbNumber?: string;
  logoUrl?: string;
  customerName: string;
  customerPhone: string;
  deviceDescription: string;
  faultDescription: string;
  lineItems: InvoiceLineItemData[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  ussdCode?: string;
}
