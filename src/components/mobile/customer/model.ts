// Customer light app: the plain, serialisable order shape the client screens
// use, plus the pure rules that turn a backend status into what the customer
// sees (tracker step, chip, next step, documents, notification copy).
// Client-safe: no Prisma or server imports. The Prisma → CustomerOrder
// mapping lives in ./server.ts.

import { CATEGORY_LABEL, formatNaira, type Category } from "@/lib/pricing";
import {
  CUSTOMER_STAGE,
  DRAWING_TIME,
  ORDER_CHIP,
  ORDER_FLOW,
  QUOTE_TURNAROUND,
  studioWhatsApp,
  type OrderStatus,
} from "@/lib/zenom-mobile";

export type CustomerItem = {
  id: string;
  title: string;
  category: Category | null;
  size: string | null;
  sizeIndex: number | null;
  framed: boolean;
  subjectCount: number;
  /** kobo snapshot: artwork + framing + extra people */
  unitPrice: number;
  /** split of unitPrice from the price table, only when it still adds up to the snapshot */
  breakdown: { artwork: number; framing: number; extra: number } | null;
  image: string;
  code: string | null;
  medium?: string;
  photoUrl?: string;
  isCommission: boolean;
};

export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  /** "12 Nov 2026" */
  requestedLabel: string;
  /** "Today", "3d ago"… (computed on the server, so no hydration drift) */
  updatedAgo: string;
  /** e.g. "Portrait from your photo" or "Blindfold + 1 more" */
  title: string;
  /** first item size "16×20" */
  size: string | null;
  framed: boolean;
  subjectCount: number;
  image: string;
  isCommission: boolean;
  medium?: string;
  neededBy?: string;
  notes: string;
  delivery: "KADUNA" | "OUTSIDE";
  deliveryFee: number;
  subtotal: number;
  total: number;
  deposit: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  /** "" when the customer left it for WhatsApp */
  deliveryAddress: string;
  items: CustomerItem[];
};

export type CustomerUser = { name: string | null; email: string | null };

/* ── Status → what the customer sees ── */

export const isCancelled = (s: OrderStatus) => s === "CANCELLED";

/** True once the order has reached `min` in the normal flow (never for cancelled orders). */
export function reached(status: OrderStatus, min: OrderStatus): boolean {
  if (status === "CANCELLED") return false;
  return ORDER_FLOW.indexOf(status) >= ORDER_FLOW.indexOf(min);
}

export function stageOf(status: OrderStatus): { step: number; label: string } {
  if (status === "CANCELLED") return { step: 0, label: "Cancelled" };
  const s = CUSTOMER_STAGE[status];
  return { step: s.step, label: s.label };
}

/** Prototype chip colours by tracker step (1 grey, 2–4 ember, 5 blue, 6 green). */
export function customerChip(status: OrderStatus): { bg: string; fg: string; label: string } {
  if (status === "CANCELLED") return { bg: ORDER_CHIP.CANCELLED[0], fg: ORDER_CHIP.CANCELLED[1], label: "Cancelled" };
  const { step, label } = stageOf(status);
  if (step === 1) return { bg: "#EFEAE2", fg: "#4A433B", label };
  if (step <= 4) return { bg: "#FBE0CB", fg: "#6B3214", label };
  if (step === 5) return { bg: "#E4E8F2", fg: "#2E3A5C", label };
  return { bg: "#E3EFE4", fg: "#1F4D24", label };
}

/** "Portrait from your photo, 16×20" */
export const orderLine = (o: Pick<CustomerOrder, "title" | "size">) => (o.size ? `${o.title}, ${o.size}` : o.title);

export const isActive = (o: Pick<CustomerOrder, "status">) => o.status !== "COMPLETED" && o.status !== "CANCELLED";

/** Orders waiting on the customer: the quote is out and the deposit is due. */
export const needsAction = (o: Pick<CustomerOrder, "status">) => o.status === "AWAITING_DEPOSIT";

/* ── Money ── */

export const balanceOf = (o: Pick<CustomerOrder, "total" | "deposit">) => Math.max(0, o.total - o.deposit);

/** "framed and delivered" / "plus delivery, quoted on WhatsApp" */
const deliveredPhrase = (o: Pick<CustomerOrder, "delivery">) =>
  o.delivery === "KADUNA" ? "delivered in Kaduna" : "plus delivery outside Kaduna, quoted on WhatsApp";

/* ── The dark "Your next step" card ── */

export type NextAction = { label: string; href: string; external?: boolean };
export type NextStep = { title: string; body: string; primary?: NextAction; secondary?: NextAction };

const wa = (label: string, text: string): NextAction => ({ label, href: studioWhatsApp(text), external: true });

// The prototype's "Accept quote", "I've made the transfer", "Approve sketch"
// and "I've received it" have no backend: they happen on WhatsApp. Each
// button opens WhatsApp with a message ready to send; nothing changes here
// until Samuel moves the order on.
export function nextStepFor(o: CustomerOrder): NextStep {
  const ref = o.orderNumber;
  switch (o.status) {
    case "PENDING":
      return {
        title: CUSTOMER_STAGE.PENDING.nextTitle,
        body: `Your quote arrives on WhatsApp and here ${QUOTE_TURNAROUND}.`,
        secondary: wa("Message Samuel", `Hello Samuel, I'm checking on my request ${ref}.`),
      };
    case "AWAITING_DEPOSIT":
      return {
        title: CUSTOMER_STAGE.AWAITING_DEPOSIT.nextTitle,
        body: `Your quote is ready: ${formatNaira(o.total)}, ${deliveredPhrase(o)}. Transfer the 50% deposit of ${formatNaira(o.deposit)} with reference ${ref}, then tell Samuel on WhatsApp. He starts as soon as it clears.`,
        primary: wa("I've made the transfer", `Hello Samuel, I've transferred the ${formatNaira(o.deposit)} deposit for ${ref} (reference ${ref}).`),
        secondary: wa("Request changes", `Hello Samuel, I'd like to discuss the quote for ${ref}.`),
      };
    case "CONFIRMED":
      return {
        title: CUSTOMER_STAGE.CONFIRMED.nextTitle,
        body: "Deposit received. Samuel sketches the composition and sends it on WhatsApp. Approve it there, or ask for changes before shading starts.",
        primary: wa("Approve sketch", `Hello Samuel, I approve the sketch for ${ref}.`),
        secondary: wa("Ask for changes", `Hello Samuel, I'd like some changes to the sketch for ${ref}.`),
      };
    case "IN_PRODUCTION":
      return {
        title: CUSTOMER_STAGE.IN_PRODUCTION.nextTitle,
        body: `Shading and finishing by hand. Ready in ${DRAWING_TIME}. Samuel messages you when it's done.`,
        secondary: wa("Message Samuel", `Hello Samuel, how is ${ref} coming along?`),
      };
    case "READY":
      return {
        title: CUSTOMER_STAGE.READY.nextTitle,
        body: `Samuel arranges delivery with you on WhatsApp. The balance of ${formatNaira(balanceOf(o))} is due on delivery. Let him know once it arrives.`,
        primary: wa("I've received it", `Hello Samuel, I've received my piece for ${ref}. Thank you!`),
        secondary: wa("Message Samuel", `Hello Samuel, about delivery for ${ref}.`),
      };
    case "COMPLETED":
      return {
        title: CUSTOMER_STAGE.COMPLETED.nextTitle,
        body: "Your certificate of authenticity is in Documents. Balance settled on delivery.",
        primary: { label: "Commission another", href: "/commission?start=1" },
        secondary: { label: "View certificate", href: `/account/orders/${o.id}/documents/certificate` },
      };
    case "CANCELLED":
    default:
      return {
        title: "This order was cancelled",
        body: "If that's a mistake, message Samuel on WhatsApp. You can always start a new request.",
        primary: { label: "Start a new commission", href: "/commission?start=1" },
        secondary: wa("Message Samuel", `Hello Samuel, about my cancelled order ${ref}.`),
      };
  }
}

/* ── Documents (derived per order) ── */

export type DocKind = "invoice" | "receipt" | "certificate";

export const DOC_KINDS: DocKind[] = ["invoice", "receipt", "certificate"];

export const DOC_META: Record<DocKind, { title: string; chip: string; from: OrderStatus; locked: string; colors: [string, string] }> = {
  invoice: { title: "Invoice", chip: "Invoice", from: "AWAITING_DEPOSIT", locked: "After quote", colors: ["#E4E8F2", "#2E3A5C"] },
  receipt: { title: "Deposit receipt", chip: "Receipt", from: "CONFIRMED", locked: "After deposit", colors: ["#E3EFE4", "#1F4D24"] },
  certificate: { title: "Certificate of authenticity", chip: "Certificate", from: "COMPLETED", locked: "On delivery", colors: ["#FBE0CB", "#6B3214"] },
};

export const isDocKind = (k: string): k is DocKind => (DOC_KINDS as string[]).includes(k);

export const docReady = (status: OrderStatus, kind: DocKind) => reached(status, DOC_META[kind].from);

export const docHref = (orderId: string, kind: DocKind) => `/account/orders/${orderId}/documents/${kind}`;

/* ── Notifications (one per order, describing where it is now) ── */

export function notificationFor(o: CustomerOrder): { title: string; body: string } {
  const line = `${o.orderNumber} · ${orderLine(o)}`;
  switch (o.status) {
    case "PENDING":
      return { title: "Request received", body: `${line} · Samuel is reviewing it` };
    case "AWAITING_DEPOSIT":
      return { title: "Your quote is ready", body: `${line} · deposit ${formatNaira(o.deposit)}` };
    case "CONFIRMED":
      return { title: "Deposit received", body: `${line} · sketching starts` };
    case "IN_PRODUCTION":
      return { title: "Samuel started drawing", body: line };
    case "READY":
      return { title: "Your piece is ready", body: `${line} · delivery on WhatsApp` };
    case "COMPLETED":
      return { title: "Delivered", body: `${line} · certificate in Documents` };
    case "CANCELLED":
    default:
      return { title: "Order cancelled", body: line };
  }
}

/** localStorage key for "this notification has been read": changes when the status changes. */
export const notifKey = (o: Pick<CustomerOrder, "id" | "status">) => `${o.id}:${o.status}`;

/* ── Misc ── */

/**
 * Customer photos may be HEIC (iPhone). Browsers and the next/image optimiser
 * can't always decode it, so ask Cloudinary for a JPG of those.
 */
export function displayPhoto(url: string): string {
  return /\.(heic|heif)$/i.test(url) && url.includes("/upload/") ? url.replace("/upload/", "/upload/f_jpg/") : url;
}

export const ROOM_KEYS: Category[] = ["portrait", "geometric", "minimalistic", "figurative"];

export const roomTitle = (c: Category) => (c === "portrait" ? "Portraits" : CATEGORY_LABEL[c]);

/** "+234 904 852 8199" from "2349048528199" */
export function prettyPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.startsWith("234") && d.length === 13) return `+234 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return d ? `+${d}` : "";
}
