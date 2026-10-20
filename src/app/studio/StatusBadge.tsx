// Shared status pill for admin tables (orders + products).
const STYLES: Record<string, string> = {
  PENDING: "border-ink/20 text-ink-2",
  AWAITING_DEPOSIT: "border-ember/50 bg-ember/10 text-ember",
  CONFIRMED: "border-ink/30 text-ink",
  IN_PRODUCTION: "border-ink/30 bg-ink/[0.08] text-ink",
  READY: "border-ink/30 bg-ink/[0.08] text-ink",
  COMPLETED: "border-ink/15 text-ink-3",
  CANCELLED: "border-ink/10 text-ink-4",
  AVAILABLE: "border-ink/30 text-ink",
  DRAFT: "border-ink/15 text-ink-3",
  SOLD_OUT: "border-ink/15 text-ink-3",
  COMING_SOON: "border-ember/40 text-ember",
};

export function statusLabel(status: string) {
  const text = status.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-pill border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
        STYLES[status] ?? "border-ink/15 text-ink-2"
      }`}
    >
      {status === "AWAITING_DEPOSIT" ? "Awaiting deposit" : statusLabel(status)}
    </span>
  );
}
