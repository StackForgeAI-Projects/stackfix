import { describe, expect, it } from "vitest";
import {
  canTransitionTicketStatus,
  generateUssdCode,
  getAllowedNextStatuses,
  getTimeOfDayGreeting,
  isValidRwandaPhone,
  normalizeRwandaPhone,
  calculateInvoiceTotals,
  TICKET_STATUS_OPTIONS,
  ticketStatusLabel,
  ticketStatusBadgeClass,
  ticketStatusUnavailableReason,
} from "./index";

describe("ticket status transitions", () => {
  it("allows pending → under_repair", () => {
    expect(canTransitionTicketStatus("pending", "under_repair", "technician")).toBe(true);
  });

  it("blocks pending → completed", () => {
    expect(canTransitionTicketStatus("pending", "completed", "technician")).toBe(false);
  });

  it("cancel only for managers (admin or super admin)", () => {
    expect(canTransitionTicketStatus("pending", "cancelled", "technician")).toBe(false);
    expect(canTransitionTicketStatus("pending", "cancelled", "admin")).toBe(true);
    expect(canTransitionTicketStatus("pending", "cancelled", "super_admin")).toBe(true);
  });

  it("picked_up is terminal", () => {
    expect(canTransitionTicketStatus("picked_up", "completed", "super_admin")).toBe(false);
  });

  it("exposes all four repair statuses in the dropdown options", () => {
    expect(TICKET_STATUS_OPTIONS).toEqual([
      "pending",
      "under_repair",
      "completed",
      "picked_up",
    ]);
    expect(ticketStatusLabel("completed")).toBe("Completed");
    expect(ticketStatusLabel("picked_up")).toBe("Picked Up");
  });

  it("maps statuses to semantic badge CSS classes", () => {
    expect(ticketStatusBadgeClass("pending")).toBe("status-badge-pending");
    expect(ticketStatusBadgeClass("under_repair")).toBe("status-badge-under-repair");
    expect(ticketStatusBadgeClass("completed")).toBe("status-badge-completed");
    expect(ticketStatusBadgeClass("picked_up")).toBe("status-badge-picked-up");
  });

  it("allows under_repair → completed transition", () => {
    expect(getAllowedNextStatuses("under_repair", "technician")).toContain("completed");
  });

  it("explains why completed is unavailable from pending", () => {
    expect(ticketStatusUnavailableReason("pending", "completed")).toBe("Mark as Under Repair first");
  });
});

describe("USSD code generation", () => {
  it("generates correct MTN format", () => {
    expect(generateUssdCode(15000, "INV-0042")).toBe("*182*8*1*15000*INV0042#");
  });
});

describe("Rwanda phone validation", () => {
  it("accepts valid numbers", () => {
    expect(isValidRwandaPhone("+250 788 123 456")).toBe(true);
    expect(isValidRwandaPhone("0788123456")).toBe(true);
  });

  it("rejects invalid numbers", () => {
    expect(isValidRwandaPhone("12345")).toBe(false);
  });

  it("normalizes to 250 prefix", () => {
    expect(normalizeRwandaPhone("0788123456")).toBe("250788123456");
  });
});

describe("invoice calculations", () => {
  it("computes VAT at 18%", () => {
    const result = calculateInvoiceTotals([{ quantity: 1, unitPrice: 100000 }], 18);
    expect(result.subtotal).toBe(100000);
    expect(result.vatAmount).toBe(18000);
    expect(result.totalAmount).toBe(118000);
  });
});

describe("time-of-day greeting", () => {
  it("returns Good morning before noon", () => {
    expect(getTimeOfDayGreeting(new Date("2026-05-22T08:30:00"))).toBe("Good morning");
  });

  it("returns Good afternoon in the afternoon", () => {
    expect(getTimeOfDayGreeting(new Date("2026-05-22T14:00:00"))).toBe("Good afternoon");
  });

  it("returns Good evening in the evening", () => {
    expect(getTimeOfDayGreeting(new Date("2026-05-22T19:00:00"))).toBe("Good evening");
  });

  it("returns Good night late at night", () => {
    expect(getTimeOfDayGreeting(new Date("2026-05-22T23:00:00"))).toBe("Good night");
  });
});
