/**
 * StackFix Design Tokens — SOP v1.0 §1.1
 * Single source of truth for colours across web, mobile, email, and PDF.
 */

export const colors = {
  primary: "#00B341",
  primaryDark: "#007A2E",
  bgDark: "#0D1F12",
  bgLight: "#F9FAFB",
  surface: "#FFFFFF",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  error: "#EF4444",
  warning: "#F59E0B",
  success: "#10B981",
  /** Bright brand green used in UI accents (Lovable scaffold) */
  brand: "#20F44E",
  ink: "#07131C",
} as const;

export const statusColors = {
  pending: { hex: "#F59E0B", label: "Pending" },
  under_repair: { hex: "#3B82F6", label: "Under Repair" },
  completed: { hex: "#10B981", label: "Completed" },
  picked_up: { hex: "#8B5CF6", label: "Picked Up" },
  paid: { hex: "#00B341", label: "Paid" },
  cancelled: { hex: "#EF4444", label: "Cancelled" },
} as const;

export type TicketStatusKey = keyof typeof statusColors;

export const cssVariables = {
  "--color-primary": colors.primary,
  "--color-primary-dark": colors.primaryDark,
  "--color-bg-dark": colors.bgDark,
  "--color-bg-light": colors.bgLight,
  "--color-surface": colors.surface,
  "--color-text-primary": colors.textPrimary,
  "--color-text-secondary": colors.textSecondary,
  "--color-border": colors.border,
  "--color-error": colors.error,
  "--color-warning": colors.warning,
  "--color-success": colors.success,
  "--brand": colors.brand,
  "--ink": colors.ink,
} as const;
