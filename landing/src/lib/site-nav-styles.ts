import type { CSSProperties } from "react";

/** Shared pinned nav bar background for homepage and StackFix headers. */
export const siteNavScrolledBarStyle: CSSProperties = {
  background: "linear-gradient(135deg, oklch(0.32 0.10 150 / 0.94), oklch(0.26 0.08 155 / 0.94))",
  backdropFilter: "blur(20px) saturate(160%)",
  WebkitBackdropFilter: "blur(20px) saturate(160%)",
};

/** Subtle left/bottom/right outline when pinned on scroll (no top edge against the viewport). */
export const siteNavScrolledBarClass =
  "w-full rounded-t-none rounded-b-3xl border-x border-b border-primary/25 px-0 py-3 shadow-[0_16px_48px_-20px_oklch(0_0_0/0.55)]";

/** Fixed header shell — clips horizontal bleed on narrow viewports. */
export const siteNavHeaderClass = "fixed inset-x-0 top-0 z-50 w-full max-w-[100vw] overflow-x-clip";

/** Inner nav row — allows logo/actions to shrink without forcing page scroll. */
export const siteNavRowClass =
  "flex w-full min-w-0 items-center justify-between gap-2 sm:gap-3 md:gap-4";

/** Logo sizing shared by homepage and StackFix headers. */
export const siteNavLogoImageClass =
  "h-5 w-auto max-w-[7.5rem] object-contain sm:max-w-none md:h-6";

export const siteNavLogoLinkClass = "group flex min-w-0 shrink items-center";
