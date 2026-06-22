import { z } from "zod";
import { isValidRwandaPhone } from "@stackfix/utils";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(128),
});

export const createTicketSchema = z.object({
  customerName: z.string().min(2).max(255),
  customerPhone: z.string().refine(isValidRwandaPhone, "Invalid Rwanda phone number"),
  customerEmail: z.string().email().optional(),
  deviceType: z.string().min(1).max(100),
  deviceBrand: z.string().max(100).optional(),
  deviceModel: z.string().max(100).optional(),
  faultDescription: z.string().min(3),
  internalNotes: z.string().optional(),
  technicianId: z.string().uuid().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["pending", "under_repair", "completed", "picked_up", "cancelled"]),
});

export const updateTicketSchema = z.object({
  customerName: z.string().min(2).max(255).optional(),
  customerPhone: z.string().refine(isValidRwandaPhone, "Invalid Rwanda phone number").optional(),
  customerEmail: z.string().email().nullable().optional(),
  deviceType: z.string().min(1).max(100).optional(),
  deviceBrand: z.string().max(100).nullable().optional(),
  deviceModel: z.string().max(100).nullable().optional(),
  faultDescription: z.string().min(3).optional(),
  internalNotes: z.string().nullable().optional(),
  technicianId: z.string().uuid().nullable().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  status: z.enum(["pending", "under_repair", "completed", "picked_up", "cancelled"]).optional(),
});

export const createInvoiceSchema = z.object({
  ticketId: z.string().uuid(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive().default(1),
        unitPrice: z.number().nonnegative(),
        itemType: z.enum(["part", "labour", "diagnostic", "other"]).optional(),
      }),
    )
    .min(1),
  dueDate: z.string().datetime().optional(),
});

export const updateInvoiceSchema = z.object({
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive().default(1),
        unitPrice: z.number().nonnegative(),
        itemType: z.enum(["part", "labour", "diagnostic", "other"]).optional(),
      }),
    )
    .min(1)
    .optional(),
  dueDate: z.string().datetime().optional(),
});

export const createCustomerSchema = z.object({
  fullName: z.string().min(2).max(255),
  phone: z.string().refine(isValidRwandaPhone, "Invalid Rwanda phone number"),
  email: z.string().email().optional(),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  createdBy: z.string().uuid().optional(),
  search: z.string().optional(),
  q: z.string().optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const notificationListSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  category: z
    .enum(["all", "messages", "tickets", "invoices", "team", "system"])
    .default("all"),
});

export const activityListSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(15),
  category: z
    .enum(["all", "tickets", "invoices", "team", "settings", "messages", "auth"])
    .default("all"),
});

export const createUserSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(12).optional(),
  role: z.enum(["admin", "technician"]),
}).refine((d) => d.email || d.phone, { message: "Email or phone is required" });

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  paymentModel: z.enum(["pay_before", "pay_on_pickup"]).optional(),
  defaultVatRate: z.number().min(0).max(100).optional(),
  language: z.enum(["en", "rw", "fr"]).optional(),
  rdbNumber: z.string().optional(),
  bankName: z.string().max(255).optional(),
  bankAccountName: z.string().max(255).optional(),
  bankAccountNumber: z.string().max(50).optional(),
});

export const translateSchema = z.object({
  texts: z.array(z.string().max(5000)).min(1).max(100),
  target: z.enum(["rw", "fr"]),
});

export const setUserAccessSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserSchema = z
  .object({
    fullName: z.string().min(2).max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.enum(["admin", "technician"]).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export const addNoteSchema = z.object({
  body: z.string().min(1),
});

export const markPaidSchema = z.object({
  paymentMethod: z.enum(["cash", "card", "other"]).default("cash"),
  notes: z.string().optional(),
});

const optionalTicketRef = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
  z.string().trim().min(1).max(50).optional(),
);

export const createStaffMessageSchema = z.object({
  subject: z.string().trim().min(3).max(255),
  body: z.string().trim().min(3).max(5000),
  requestType: z.enum(["general", "edit_ticket", "delete_ticket"]).default("general"),
  ticketId: optionalTicketRef,
});

export const replyStaffMessageSchema = z.object({
  body: z.string().min(1).max(5000),
});
