// Server-component-safe pill link styles matching ui/Button variants.
// (`buttonClass` lives in the "use client" Button.tsx module, so it can't be
// called from server components such as these pages.)
const base =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill px-6 py-3 text-sm font-semibold tracking-wide transition-colors duration-200";

export const linkPrimary = `${base} bg-ink text-night hover:bg-ember hover:text-night`;
export const linkSecondary = `${base} border border-ink/25 text-ink hover:border-ink/60 hover:text-ink`;
