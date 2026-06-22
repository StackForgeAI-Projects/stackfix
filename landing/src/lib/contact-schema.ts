import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(100).trim(),
  email: z.string().email({ message: "Please enter a valid email" }).max(254).toLowerCase().trim(),
  company: z
    .string()
    .trim()
    .min(1, { message: "Company is required" })
    .max(100, { message: "Company must be at most 100 characters" }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(5000)
    .trim(),
  phone: z.string().max(40).trim().optional().or(z.literal("")),
  source: z.enum(["website", "stackfix"]).optional(),
  // Honeypot — must be empty
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  // Honeypot
  fullName: z.string().max(0).optional().or(z.literal("")),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
