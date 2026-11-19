// The customer's taps on an order (POST /api/account/orders/[id]) read as
// cues for Samuel in the studio. The taps never change the status; these
// helpers decide which ones still need him. Client-safe: no Prisma imports.

type When = Date | string | null | undefined;

export type OrderFlagFields = {
  status: string;
  customerPaidAt?: When;
  sketchApprovedAt?: When;
  sketchFeedbackAt?: When;
};

const time = (d: When) => (d ? new Date(d).getTime() : 0);

/** Statuses in which the customer can approve the sketch or ask for changes. */
export const SKETCH_REVIEW_STATUSES = ["CONFIRMED", "IN_PRODUCTION"];

/** Still waiting on the deposit, and the customer tapped "I've made the transfer". */
export const saysPaid = (o: OrderFlagFields) => o.status === "AWAITING_DEPOSIT" && !!o.customerPaidAt;

/**
 * The customer's latest "ask for changes" came after the newest sketch photo,
 * the sketch isn't approved, and the order is still at the sketch stage.
 */
export function changesPending(o: OrderFlagFields, latestSketchAt: When): boolean {
  if (!o.sketchFeedbackAt || o.sketchApprovedAt) return false;
  if (!SKETCH_REVIEW_STATUSES.includes(o.status)) return false;
  return time(o.sketchFeedbackAt) > time(latestSketchAt);
}

export type AttentionFlag = "says-paid" | "changes-asked" | "sketch-approved";

/** The one cue a studio list row shows, most urgent first. */
export function attentionFlag(o: OrderFlagFields, latestSketchAt: When): AttentionFlag | null {
  if (saysPaid(o)) return "says-paid";
  if (changesPending(o, latestSketchAt)) return "changes-asked";
  // Approved while still CONFIRMED: the cue to move it to production.
  if (o.status === "CONFIRMED" && o.sketchApprovedAt) return "sketch-approved";
  return null;
}

export const ATTENTION_LABEL: Record<AttentionFlag, string> = {
  "says-paid": "Says paid",
  "changes-asked": "Changes asked",
  "sketch-approved": "Sketch approved",
};

/** Light-app chip colours (background, text). */
export const ATTENTION_CHIP: Record<AttentionFlag, [string, string]> = {
  "says-paid": ["#E58A52", "#1A1714"],
  "changes-asked": ["#9A4A1F", "#FFFFFF"],
  "sketch-approved": ["#E3EFE4", "#1F4D24"],
};

/** Dark studio (desktop) chip classes. */
export const ATTENTION_CLASS: Record<AttentionFlag, string> = {
  "says-paid": "border-ember bg-ember text-night",
  "changes-asked": "border-ember/60 text-ember",
  "sketch-approved": "border-ink/30 text-ink",
};

/* ── Progress photos ── */

export type PhotoStage = "SKETCH" | "SHADING" | "FINISHED";

export const PHOTO_STAGES: { key: PhotoStage; label: string; noun: string }[] = [
  { key: "SKETCH", label: "Sketch", noun: "sketch" },
  { key: "SHADING", label: "Shading", noun: "shading" },
  { key: "FINISHED", label: "Finished", noun: "finished" },
];

/** Under the sketch photos: how the customer reviews them (null once past the sketch stage). */
export function sketchHint(status: string, first: string, hasAccount: boolean): string | null {
  if (status === "PENDING" || status === "AWAITING_DEPOSIT") {
    return `Sketches usually follow the deposit. ${first} can approve one once the order is confirmed.`;
  }
  if (!SKETCH_REVIEW_STATUSES.includes(status)) return null;
  return hasAccount
    ? `${first} approves the sketch from their order page. Your first sketch photo emails them a link.`
    : `${first} has no account on this order, so agree the sketch on WhatsApp.`;
}

/** The stage Samuel is most likely photographing at this status. */
export function defaultPhotoStage(status: string): PhotoStage {
  if (status === "IN_PRODUCTION") return "SHADING";
  if (status === "READY" || status === "COMPLETED") return "FINISHED";
  return "SKETCH";
}
