/** Responsive breakpoints — SOP v1.0 §1.3 */

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type BreakpointKey = keyof typeof breakpoints;
