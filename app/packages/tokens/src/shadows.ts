/** Elevation tokens — SOP v1.0 §1.1 */

export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
} as const;

export const cssShadowVariables = {
  "--shadow-sm": shadows.sm,
  "--shadow-md": shadows.md,
  "--shadow-lg": shadows.lg,
} as const;
