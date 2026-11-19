import { ARTWORK_STATUS, ORDER_CHIP, ORDER_LABEL, type ArtworkStatus, type OrderStatus } from "@/lib/zenom-mobile";

/** Order status chip (.chipst) at the compact sizes the studio rows use. */
export function OrderStatusChip({ status, size = "sm" }: { status: string; size?: "xs" | "sm" | "md" }) {
  const s = (status in ORDER_CHIP ? status : "PENDING") as OrderStatus;
  const [bg, fg] = ORDER_CHIP[s];
  const dims = size === "xs" ? { height: 22, fontSize: 10 } : size === "sm" ? { height: 24, fontSize: 11 } : { height: 26, fontSize: 12 };
  return (
    <span className="chipst" style={{ background: bg, color: fg, ...dims }}>
      {ORDER_LABEL[s]}
    </span>
  );
}

export function artworkChipStyle(status: string): React.CSSProperties {
  const s = ARTWORK_STATUS[(status in ARTWORK_STATUS ? status : "DRAFT") as ArtworkStatus];
  return { background: s.chip[0], color: s.chip[1] };
}
