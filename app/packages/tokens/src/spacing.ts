/** Base-4 spacing scale — SOP v1.0 §1.1 */

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
} as const;

export const cssSpacingVariables = {
  "--space-1": spacing[1],
  "--space-2": spacing[2],
  "--space-3": spacing[3],
  "--space-4": spacing[4],
  "--space-6": spacing[6],
  "--space-8": spacing[8],
  "--space-12": spacing[12],
  "--space-16": spacing[16],
} as const;
