/** StackFix typography tokens — SOP v1.0 §1.1 */

export const fontFamilies = {
  sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
} as const;

export const fontSizes = {
  xs: { size: "0.75rem", lineHeight: "1rem", weight: 400 },
  sm: { size: "0.875rem", lineHeight: "1.25rem", weight: 400 },
  base: { size: "1rem", lineHeight: "1.5rem", weight: 400 },
  lg: { size: "1.125rem", lineHeight: "1.75rem", weight: 500 },
  xl: { size: "1.25rem", lineHeight: "1.75rem", weight: 600 },
  "2xl": { size: "1.5rem", lineHeight: "2rem", weight: 700 },
  "3xl": { size: "1.875rem", lineHeight: "2.25rem", weight: 700 },
  "4xl": { size: "2.25rem", lineHeight: "2.5rem", weight: 800 },
} as const;

export type FontSizeKey = keyof typeof fontSizes;
