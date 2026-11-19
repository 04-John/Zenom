import { ATTENTION_CHIP, ATTENTION_LABEL, type AttentionFlag } from "@/lib/order-flags";
import { ARTWORK_STATUS, ORDER_CHIP, ORDER_LABEL, type ArtworkStatus, type OrderStatus } from "@/lib/zenom-mobile";

const chipDims = (size: "xs" | "sm" | "md") =>
  size === "xs" ? { height: 22, fontSize: 10 } : size === "sm" ? { height: 24, fontSize: 11 } : { height: 26, fontSize: 12 };

/** Order status chip (.chipst) at the compact sizes the studio rows use. */
export function OrderStatusChip({ status, size = "sm" }: { status: string; size?: "xs" | "sm" | "md" }) {
  const s = (status in ORDER_CHIP ? status : "PENDING") as OrderStatus;
  const [bg, fg] = ORDER_CHIP[s];
  return (
    <span className="chipst" style={{ background: bg, color: fg, ...chipDims(size) }}>
      {ORDER_LABEL[s]}
    </span>
  );
}

/** "Says paid" / "Changes asked" / "Sketch approved": what the customer tapped and Samuel still has to act on. */
export function AttentionChip({ flag, size = "xs" }: { flag: AttentionFlag; size?: "xs" | "sm" | "md" }) {
  const [bg, fg] = ATTENTION_CHIP[flag];
  return (
    <span className="chipst" style={{ background: bg, color: fg, ...chipDims(size) }}>
      {ATTENTION_LABEL[flag]}
    </span>
  );
}

export function artworkChipStyle(status: string): React.CSSProperties {
  const s = ARTWORK_STATUS[(status in ARTWORK_STATUS ? status : "DRAFT") as ArtworkStatus];
  return { background: s.chip[0], color: s.chip[1] };
}
