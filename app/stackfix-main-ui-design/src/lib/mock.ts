export type TicketStatus = "Pending" | "Under Repair" | "Completed" | "Picked Up";
export type PaymentStatus = "Paid" | "Unpaid";

export type Ticket = {
  id: string;
  customer: string;
  phone: string;
  device: string;
  fault: string;
  technician: string;
  createdAt: string;
  status: TicketStatus;
  payment: PaymentStatus;
  amount: number;
  deviceKind: "phone" | "laptop" | "tablet" | "console";
};

export const tickets: Ticket[] = [
  { id: "SF-2904", customer: "Jean-Paul Mugisha", phone: "+250 788 123 456", device: "iPhone 13 Pro", fault: "Screen Replacement", technician: "Eric K.", createdAt: "Today · 09:14", status: "Under Repair", payment: "Unpaid", amount: 120000, deviceKind: "phone" },
  { id: "SF-2905", customer: "Alice Umutoni", phone: "+250 785 990 112", device: "MacBook Air M1", fault: "Battery swelling", technician: "Sarah U.", createdAt: "Today · 08:42", status: "Under Repair", payment: "Unpaid", amount: 285000, deviceKind: "laptop" },
  { id: "SF-2906", customer: "Kevin Ganza", phone: "+250 722 410 555", device: "PS5 Console", fault: "HDMI port repair", technician: "Eric K.", createdAt: "Yesterday", status: "Completed", payment: "Paid", amount: 75000, deviceKind: "console" },
  { id: "SF-2907", customer: "Divine Uwase", phone: "+250 788 311 902", device: "Samsung S23", fault: "Charging port", technician: "Moses R.", createdAt: "Yesterday", status: "Picked Up", payment: "Paid", amount: 45000, deviceKind: "phone" },
  { id: "SF-2908", customer: "Aimé Ndoli", phone: "+250 788 991 020", device: "iPad Pro 11\"", fault: "Cracked screen", technician: "Sarah U.", createdAt: "2 days ago", status: "Pending", payment: "Unpaid", amount: 180000, deviceKind: "tablet" },
  { id: "SF-2909", customer: "Grace Ishimwe", phone: "+250 732 111 222", device: "HP EliteBook", fault: "Won't power on", technician: "Moses R.", createdAt: "2 days ago", status: "Under Repair", payment: "Unpaid", amount: 95000, deviceKind: "laptop" },
  { id: "SF-2910", customer: "Patrick Habimana", phone: "+250 788 220 441", device: "iPhone 12", fault: "Battery replacement", technician: "Eric K.", createdAt: "3 days ago", status: "Completed", payment: "Paid", amount: 65000, deviceKind: "phone" },
  { id: "SF-2911", customer: "Linda Mukamana", phone: "+250 785 661 778", device: "Dell XPS 13", fault: "Keyboard replacement", technician: "Sarah U.", createdAt: "3 days ago", status: "Pending", payment: "Unpaid", amount: 140000, deviceKind: "laptop" },
  { id: "SF-2912", customer: "Eric Niyonzima", phone: "+250 722 884 112", device: "iPad Air", fault: "Touch ID repair", technician: "Moses R.", createdAt: "4 days ago", status: "Picked Up", payment: "Paid", amount: 88000, deviceKind: "tablet" },
  { id: "SF-2913", customer: "Sandra Iradukunda", phone: "+250 788 552 003", device: "Xbox Series X", fault: "Disc drive", technician: "Eric K.", createdAt: "5 days ago", status: "Under Repair", payment: "Unpaid", amount: 110000, deviceKind: "console" },
];

export const statusColor = (s: TicketStatus): string => {
  switch (s) {
    case "Pending": return "bg-orange-100 text-orange-700";
    case "Under Repair": return "bg-blue-100 text-blue-700";
    case "Completed": return "bg-emerald-100 text-emerald-700";
    case "Picked Up": return "bg-ink/10 text-ink";
  }
};

export const paymentColor = (p: PaymentStatus): string => {
  switch (p) {
    case "Paid": return "text-emerald-600";
    case "Unpaid": return "text-red-600";
  }
};

export const paymentBadge = (p: PaymentStatus): string => {
  switch (p) {
    case "Paid": return "bg-emerald-100 text-emerald-700";
    case "Unpaid": return "bg-red-100 text-red-700";
  }
};

export const formatRWF = (n: number) =>
  new Intl.NumberFormat("en-RW").format(n);
