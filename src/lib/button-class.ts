import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "ember" | "paper";

// Plain (non-client) module so server components can style <Link>s as buttons.
const variants: Record<ButtonVariant, string> = {
  // solid ink pill on dark
  primary: "bg-ink text-night hover:bg-ember hover:text-night",
  // hairline outline on dark
  secondary: "border border-ink/25 text-ink hover:border-ink/60 hover:text-ink",
  ghost: "text-ink hover:text-ember",
  ember: "bg-ember text-night hover:bg-ink hover:text-night",
  // dark pill for the paper world (bag, checkout, pricing)
  paper: "bg-paper-ink text-paper hover:bg-rust hover:text-paper",
};

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill px-6 py-3 text-sm font-semibold tracking-wide transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    className
  );
}
