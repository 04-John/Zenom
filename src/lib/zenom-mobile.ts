/**
 * Zenom Studio — shared constants for the mobile designs (dark storefront,
 * customer app, studio admin). Mirrors the logic classes in
 * zenom_mobile_handoff/reference/{Flow-Mobile,Studio-Mobile,Prototype}.dc.html.
 *
 * Prices are NOT duplicated here: they come from src/lib/pricing.ts (the
 * single source of truth) and are in KOBO, like everything Prisma stores.
 * Client-safe: no Prisma or server imports.
 */
import {
  ABSTRACT_PRICES,
  DELIVERY_KADUNA,
  DEPOSIT_RATE,
  FRAMING_PRICES,
  PORTRAIT_PRICES,
  PRICE_PER_ADDITIONAL_SUBJECT,
  SIZES,
  WHATSAPP_NUMBER,
  fromDbCategory,
  orderTotals,
  unitPriceFor,
  type DbCategory,
} from "@/lib/pricing";

/* ── Sizes + prices (kobo), re-exported from pricing.ts ── */
export const SIZE_LABELS: readonly string[] = SIZES.map((s) => s.label);
export const SIZE_INCHES: readonly [number, number][] = SIZES.map((s) => [s.widthIn, s.heightIn] as [number, number]);
export const PRICE_PORTRAIT = PORTRAIT_PRICES;
export const PRICE_ABSTRACT = ABSTRACT_PRICES;
export const PRICE_FRAME = FRAMING_PRICES;
export const EXTRA_PERSON = PRICE_PER_ADDITIONAL_SUBJECT;
export const KADUNA_DELIVERY = DELIVERY_KADUNA;
export { DEPOSIT_RATE };

export type Category = DbCategory;

/** One piece, in kobo: artwork + framing + extra people (portraits only). */
export function piecePrice(p: { category: Category; sizeIdx: number; framed: boolean; people?: number }) {
  return unitPriceFor({
    category: fromDbCategory(p.category),
    sizeIndex: p.sizeIdx,
    framed: p.framed,
    subjectCount: p.category === "PORTRAIT" ? p.people ?? 1 : 1,
  });
}

/** Order total in kobo (Kaduna delivery added; outside Kaduna is quoted on WhatsApp). */
export function orderTotal(pieces: Parameters<typeof piecePrice>[0][], kaduna: boolean) {
  return orderTotals(
    pieces.map((p) => ({
      category: fromDbCategory(p.category),
      sizeIndex: p.sizeIdx,
      framed: p.framed,
      subjectCount: p.category === "PORTRAIT" ? p.people ?? 1 : 1,
    })),
    kaduna ? "kaduna" : "other"
  ).total;
}

/* ── Order status (matches the ?status= values on /studio/orders) ── */
export type OrderStatus =
  | "PENDING" | "AWAITING_DEPOSIT" | "CONFIRMED" | "IN_PRODUCTION" | "READY" | "COMPLETED" | "CANCELLED";

export const ORDER_STATUSES: OrderStatus[] = ["PENDING", "AWAITING_DEPOSIT", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"];
export const ORDER_FLOW: OrderStatus[] = ["PENDING", "AWAITING_DEPOSIT", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED"];

export const ORDER_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  AWAITING_DEPOSIT: "Awaiting deposit",
  CONFIRMED: "Confirmed",
  IN_PRODUCTION: "In production",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** Light-app status chip colours (background, text). */
export const ORDER_CHIP: Record<OrderStatus, [string, string]> = {
  PENDING: ["#EFEAE2", "#4A433B"],
  AWAITING_DEPOSIT: ["#FBE0CB", "#6B3214"],
  CONFIRMED: ["#E4E8F2", "#2E3A5C"],
  IN_PRODUCTION: ["#F3E6D6", "#7A4A12"],
  READY: ["#E3EFE4", "#1F4D24"],
  COMPLETED: ["#1A1714", "#FFFFFF"],
  CANCELLED: ["#F6DAD7", "#8A1F14"],
};

/**
 * Studio admin: the dark "Your next step" card on an order. `next` = status the
 * primary button moves to. The studio adds "· customer emailed" to the toast
 * when PATCH /api/orders/[id] reports the status email went out.
 */
export const ADMIN_NEXT_STEP: Record<OrderStatus, { title: string; cta?: string; next?: OrderStatus; toast?: string }> = {
  PENDING: { title: "Send the quote", cta: "Mark quote sent", next: "AWAITING_DEPOSIT", toast: "Quote sent · waiting for deposit" },
  AWAITING_DEPOSIT: { title: "Waiting for the deposit", cta: "Mark deposit received", next: "CONFIRMED", toast: "Deposit received · order confirmed" },
  CONFIRMED: { title: "Start drawing", cta: "Move to production", next: "IN_PRODUCTION", toast: "Moved to production" },
  IN_PRODUCTION: { title: "Drawing in progress", cta: "Mark ready", next: "READY", toast: "Marked ready" },
  READY: { title: "Deliver and collect the balance", cta: "Mark delivered & paid", next: "COMPLETED", toast: "Order completed" },
  COMPLETED: { title: "Completed" },
  CANCELLED: { title: "Cancelled" },
};

/** The six dots of the customer's tracker (Flow-Mobile STAGES). */
export const CUSTOMER_STAGES = ["Reviewing", "Quote ready", "Deposit due", "Sketch ready", "Drawing", "Delivered"] as const;

/** Customer app: how each backend status reads to the buyer (6-dot tracker). */
export const CUSTOMER_STAGE: Record<Exclude<OrderStatus, "CANCELLED">, { step: number; label: string; nextTitle: string }> = {
  PENDING: { step: 1, label: "Reviewing", nextTitle: "Samuel is reviewing your request" },
  AWAITING_DEPOSIT: { step: 3, label: "Deposit due", nextTitle: "Pay your deposit" },
  CONFIRMED: { step: 4, label: "Sketching", nextTitle: "Approve the sketch" },
  IN_PRODUCTION: { step: 5, label: "Drawing", nextTitle: "Drawing in progress" },
  READY: { step: 5, label: "Ready", nextTitle: "Your piece is ready" },
  COMPLETED: { step: 6, label: "Delivered", nextTitle: "Delivered. Enjoy your piece." },
};

/* ── Artwork (product) status — matches /studio/products?status= ── */
export type ArtworkStatus = "AVAILABLE" | "SOLD_OUT" | "COMING_SOON" | "DRAFT";
export const ARTWORK_STATUSES: ArtworkStatus[] = ["AVAILABLE", "SOLD_OUT", "COMING_SOON", "DRAFT"];
export const ARTWORK_STATUS: Record<ArtworkStatus, { label: string; help: string; chip: [string, string] }> = {
  AVAILABLE: { label: "Available", help: "Shown on the site and can be ordered", chip: ["#E3EFE4", "#1F4D24"] },
  SOLD_OUT: { label: "Sold out", help: "Shown, but the order button is off", chip: ["#1A1714", "#FFFFFF"] },
  COMING_SOON: { label: "Coming soon", help: "Shown with a Coming soon label", chip: ["#FBE0CB", "#6B3214"] },
  DRAFT: { label: "Draft", help: "Hidden from the site", chip: ["#EFEAE2", "#4A433B"] },
};

/* ── Light-app tokens (customer app + studio) ── */
export const LIGHT = {
  ground: "#FAF7F2", card: "#FFFFFF", field: "#F6F2EB", line: "#E8E2D8", hair: "#EFEAE2",
  ink: "#1A1714", ink2: "#4A433B", ink3: "#6E665C",
  ember: "#E58A52", rust: "#9A4A1F", night: "#12100E", danger: "#B42318",
  ease: "cubic-bezier(.22,1,.36,1)", spring: "cubic-bezier(.34,1.56,.64,1)",
};

/* ── Formatting ── */
/** "₦45k", "₦1.25m" from kobo (compact, for bars and price tables). */
export function kfmt(kobo: number): string {
  const n = Math.round(kobo / 100);
  if (n >= 1_000_000) return "₦" + (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "m";
  if (n >= 1_000) return "₦" + Math.round(n / 1_000) + "k";
  return "₦" + n;
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "12 Nov 2026" */
export function fmtDate(d: Date | string | number): string {
  const x = new Date(d);
  return `${x.getDate()} ${MON[x.getMonth()]} ${x.getFullYear()}`;
}

/** "Today", "Yesterday", "3d ago", "12 Nov" — relative to `now` (pass it in on the server to avoid drift). */
export function ago(d: Date | string | number, now: number = Date.now()): string {
  const x = new Date(d);
  const days = Math.floor((startOfDay(now) - startOfDay(x.getTime())) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${x.getDate()} ${MON[x.getMonth()]}`;
}

function startOfDay(t: number) {
  const x = new Date(t);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** Two-letter initials for avatar tiles. */
export function initials(name?: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "ZS";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/* ── WhatsApp links (client-safe) ── */
/** Customer → studio, pre-filled. */
export function studioWhatsApp(text?: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Studio → customer. Normalises Nigerian numbers ("0803…" → "234803…"). */
export function customerWhatsApp(phone: string, text?: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
