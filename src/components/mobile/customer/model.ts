// Customer light app: the plain, serialisable order shape the client screens
// use, plus the pure rules that turn a backend status (and the customer's
// own taps, and Samuel's progress photos) into what the customer sees
// (tracker step, chip, next step, documents, notification copy).
// Client-safe: no Prisma or server imports. The Prisma → CustomerOrder
// mapping lives in ./server.ts.

import { CATEGORY_LABEL, formatNaira, type Category } from "@/lib/pricing";
import type { StudioInfo } from "@/lib/studio-info";
import { ORDER_CHIP, ORDER_FLOW, studioWhatsApp, type OrderStatus } from "@/lib/zenom-mobile";

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
  /** "Charcoal" (commission requests only) */
  medium?: string;
  /** the customer's reference photo (commission requests only) */
  photoUrl?: string;
  isCommission: boolean;
};

export type PhotoStage = "SKETCH" | "SHADING" | "FINISHED";

export const PHOTO_STAGES: { key: PhotoStage; label: string }[] = [
  { key: "SKETCH", label: "Sketch" },
  { key: "SHADING", label: "Shading" },
  { key: "FINISHED", label: "Finished" },
];

export const PHOTO_STAGE_LABEL: Record<PhotoStage, string> = { SKETCH: "Sketch", SHADING: "Shading", FINISHED: "Finished" };

/** A progress photo Samuel shared on the order (Cloudinary URL). */
export type CustomerPhoto = { id: string; stage: PhotoStage; url: string; createdAt: string };

/** The customer's taps, as POST /api/account/orders/[id] returns them (ISO or null). */
export type OrderFlags = {
  quoteAcceptedAt: string | null;
  /** "I've made the transfer" */
  customerPaidAt: string | null;
  sketchApprovedAt: string | null;
  /** latest "Ask for changes" text */
  sketchFeedback: string | null;
  sketchFeedbackAt: string | null;
};

export type CustomerOrder = OrderFlags & {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  /** updatedAt, or the newest progress photo if that's later (ISO) */
  lastActivityAt: string;
  /** "12 Nov 2026" */
  requestedLabel: string;
  /** "Today", "3d ago"… of lastActivityAt (computed on the server, so no hydration drift) */
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
  /** "YYYY-MM-DD" */
  neededBy?: string;
  /** the customer's own words from the request */
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
  /** Samuel's progress photos, oldest first */
  photos: CustomerPhoto[];
  /** set when Samuel marks the order delivered (ISO) */
  deliveredAt: string | null;
};

export type CustomerUser = { name: string | null; email: string | null };

/* ── Status → what the customer sees ── */

export const isCancelled = (s: OrderStatus) => s === "CANCELLED";

/** True once the order has reached `min` in the normal flow (never for cancelled orders). */
export function reached(status: OrderStatus, min: OrderStatus): boolean {
  if (status === "CANCELLED") return false;
  return ORDER_FLOW.indexOf(status) >= ORDER_FLOW.indexOf(min);
}

export const photosOf = (o: Pick<CustomerOrder, "photos">, stage: PhotoStage) => o.photos.filter((p) => p.stage === stage);

/** The newest sketch photo (the one the customer approves), or null. */
export function latestSketch(o: Pick<CustomerOrder, "photos">): CustomerPhoto | null {
  const s = photosOf(o, "SKETCH");
  return s[s.length - 1] ?? null;
}

/** The customer asked for changes after the newest sketch: Samuel owes a revised one. */
export function feedbackPending(o: Pick<CustomerOrder, "photos" | "sketchFeedbackAt">): boolean {
  const s = latestSketch(o);
  return !!o.sketchFeedbackAt && !!s && Date.parse(o.sketchFeedbackAt) > Date.parse(s.createdAt);
}

/**
 * Where the order is, from the customer's side. The taps never change the
 * status (only Samuel does), so the same status can read differently:
 * AWAITING_DEPOSIT is "quote" until they accept, "deposit" until they say
 * they've paid, then "checking" while Samuel looks at his bank.
 */
export type Phase =
  | "reviewing"
  | "quote"
  | "deposit"
  | "checking"
  | "sketching"
  | "sketch"
  | "revising"
  | "drawing"
  | "ready"
  | "delivered"
  | "cancelled";

type PhaseInput = Pick<CustomerOrder, "status" | "photos" | "quoteAcceptedAt" | "customerPaidAt" | "sketchApprovedAt" | "sketchFeedbackAt">;

export function phaseOf(o: PhaseInput): Phase {
  switch (o.status) {
    case "PENDING":
      return "reviewing";
    case "AWAITING_DEPOSIT":
      return o.customerPaidAt ? "checking" : o.quoteAcceptedAt ? "deposit" : "quote";
    case "CONFIRMED":
    case "IN_PRODUCTION":
      if (o.sketchApprovedAt) return "drawing";
      if (!latestSketch(o)) return o.status === "CONFIRMED" ? "sketching" : "drawing";
      return feedbackPending(o) ? "revising" : "sketch";
    case "READY":
      return "ready";
    case "COMPLETED":
      return "delivered";
    case "CANCELLED":
    default:
      return "cancelled";
  }
}

/** Tracker step (1–6, CUSTOMER_STAGES in zenom-mobile.ts) and label per phase. */
const PHASE_STAGE: Record<Phase, { step: number; label: string }> = {
  reviewing: { step: 1, label: "Reviewing" },
  quote: { step: 2, label: "Quote ready" },
  deposit: { step: 3, label: "Deposit due" },
  checking: { step: 3, label: "Checking payment" },
  sketching: { step: 4, label: "Sketching" },
  sketch: { step: 4, label: "Sketch ready" },
  revising: { step: 4, label: "Revising sketch" },
  drawing: { step: 5, label: "Drawing" },
  ready: { step: 5, label: "Ready" },
  delivered: { step: 6, label: "Delivered" },
  cancelled: { step: 0, label: "Cancelled" },
};

export function stageOf(o: PhaseInput): { step: number; label: string } {
  return PHASE_STAGE[phaseOf(o)];
}

/** Prototype chip colours by tracker step (1 grey, 2–4 ember, 5 blue, 6 green). */
export function customerChip(o: PhaseInput): { bg: string; fg: string; label: string } {
  if (o.status === "CANCELLED") return { bg: ORDER_CHIP.CANCELLED[0], fg: ORDER_CHIP.CANCELLED[1], label: "Cancelled" };
  const { step, label } = stageOf(o);
  if (step === 1) return { bg: "#EFEAE2", fg: "#4A433B", label };
  if (step <= 4) return { bg: "#FBE0CB", fg: "#6B3214", label };
  if (step === 5) return { bg: "#E4E8F2", fg: "#2E3A5C", label };
  return { bg: "#E3EFE4", fg: "#1F4D24", label };
}

/** "Portrait from your photo, 16×20" */
export const orderLine = (o: Pick<CustomerOrder, "title" | "size">) => (o.size ? `${o.title}, ${o.size}` : o.title);

export const isActive = (o: Pick<CustomerOrder, "status">) => o.status !== "COMPLETED" && o.status !== "CANCELLED";

/** What the "Needs your action" sheet shows for an order waiting on the customer, or null. */
export function actionFor(o: CustomerOrder): { chip: string; cta: string } | null {
  switch (phaseOf(o)) {
    case "quote":
      return { chip: "Quote ready", cta: `Accept quote of ${formatNaira(o.total)}` };
    case "deposit":
      return { chip: "Deposit due", cta: `Pay deposit of ${formatNaira(o.deposit)}` };
    case "sketch":
      return { chip: "Sketch ready", cta: "Approve the sketch" };
    default:
      return null;
  }
}

/** Orders waiting on the customer: a quote to accept, a deposit to pay or a sketch to approve. */
export const needsAction = (o: CustomerOrder) => actionFor(o) !== null;

/* ── Money ── */

export const balanceOf = (o: Pick<CustomerOrder, "total" | "deposit">) => Math.max(0, o.total - o.deposit);

/** "framed and delivered" / "plus delivery, quoted on WhatsApp" */
const deliveredPhrase = (o: Pick<CustomerOrder, "delivery">) =>
  o.delivery === "KADUNA" ? "delivered in Kaduna" : "plus delivery outside Kaduna, quoted on WhatsApp";

/* ── The customer's buttons (POST /api/account/orders/[id]) ── */

export type OrderAction = "accept-quote" | "paid" | "approve-sketch" | "request-changes";

/** Toast after a successful tap. */
export const ACTION_DONE: Record<OrderAction, string> = {
  "accept-quote": "Quote accepted · Samuel knows",
  paid: "Thanks · Samuel will check his bank",
  "approve-sketch": "Sketch approved · thank you",
  "request-changes": "Sent · Samuel will revise it",
};

/* ── The dark "Your next step" card ── */

/**
 * A button on the card: a link (`href`, WhatsApp when `external`), one of
 * the order actions above, or "ask-changes", which opens the feedback sheet.
 */
export type NextAction = {
  label: string;
  href?: string;
  external?: boolean;
  action?: Exclude<OrderAction, "request-changes"> | "ask-changes";
};

export type NextStep = {
  phase: Phase;
  title: string;
  body: string;
  /** what the card shows under the body: bank details, the sketch to approve, or the customer's change request */
  extra?: "bank" | "sketch" | "feedback";
  primary?: NextAction;
  secondary?: NextAction;
};

const wa = (label: string, text: string): NextAction => ({ label, href: studioWhatsApp(text), external: true });

// "Accept quote", "I've made the transfer", "Approve sketch" and "Ask for
// changes" are real buttons: they flag the order for Samuel and email him
// (the status only moves when he does). "I've received it" still happens on
// WhatsApp: Samuel marks the order delivered when the balance is paid.
export function nextStepFor(o: CustomerOrder, info: Pick<StudioInfo, "bank" | "quoteTurnaround" | "drawingTime">): NextStep {
  const ref = o.orderNumber;
  const phase = phaseOf(o);
  switch (phase) {
    case "reviewing":
      return {
        phase,
        title: "Samuel is reviewing your request",
        body: `Your quote arrives here and on WhatsApp ${info.quoteTurnaround}.`,
        secondary: wa("Message Samuel", `Hello Samuel, I'm checking on my request ${ref}.`),
      };
    case "quote":
      return {
        phase,
        title: "Your quote is ready",
        body: `${formatNaira(o.total)}, ${deliveredPhrase(o)}. Accept it, then pay the 50% deposit of ${formatNaira(o.deposit)} and Samuel starts your sketch.`,
        primary: { label: "Accept quote", action: "accept-quote" },
        secondary: wa("Ask a question", `Hello Samuel, I have a question about the quote for ${ref}.`),
      };
    case "deposit":
      return {
        phase,
        title: "Pay your deposit",
        body: info.bank
          ? `Transfer ${formatNaira(o.deposit)} (50%) to the account below, with ${ref} as the reference. Then tap I've made the transfer so Samuel can check his bank.`
          : `Transfer ${formatNaira(o.deposit)} (50%) with ${ref} as the reference. Samuel sends the bank details on WhatsApp, so please wait for them before you transfer.`,
        extra: info.bank ? "bank" : undefined,
        primary: { label: "I've made the transfer", action: "paid" },
        secondary: info.bank
          ? wa("Ask a question", `Hello Samuel, I have a question about paying the deposit for ${ref}.`)
          : wa("Ask for bank details", `Hello Samuel, please send the bank details for ${ref}.`),
      };
    case "checking":
      return {
        phase,
        title: "Samuel is checking your transfer",
        body: `Thanks for sending the ${formatNaira(o.deposit)} deposit. Samuel confirms it here once it shows in his bank, then starts your sketch.`,
        secondary: wa("Send proof of payment", `Hello Samuel, here is my proof of payment for ${ref}.`),
      };
    case "sketching":
      return {
        phase,
        title: "Samuel is sketching",
        body: "Deposit received, thank you. The sketch shows up here for you to approve before Samuel starts shading.",
        secondary: wa("Message Samuel", `Hello Samuel, how is the sketch for ${ref} coming along?`),
      };
    case "sketch":
      return {
        phase,
        title: "Approve the sketch",
        body: "Your sketch is ready. Have a look, then approve it so Samuel can start shading, or ask for changes.",
        extra: "sketch",
        primary: { label: "Approve sketch", action: "approve-sketch" },
        secondary: { label: "Ask for changes", action: "ask-changes" },
      };
    case "revising":
      return {
        phase,
        title: "Samuel is revising the sketch",
        body: "Thanks for your notes. The new sketch shows up here for you to approve.",
        extra: "feedback",
        secondary: wa("Message Samuel", `Hello Samuel, about the sketch changes for ${ref}.`),
      };
    case "drawing":
      return o.status === "CONFIRMED"
        ? {
            phase,
            title: "Sketch approved",
            body: `Thank you! Samuel starts shading next. Your piece is ready in ${info.drawingTime}.`,
            secondary: wa("Message Samuel", `Hello Samuel, about ${ref}.`),
          }
        : {
            phase,
            title: "Drawing in progress",
            body: `Shading and finishing by hand. Ready in ${info.drawingTime}. Progress photos show up here as Samuel shares them.`,
            secondary: wa("Message Samuel", `Hello Samuel, how is ${ref} coming along?`),
          };
    case "ready":
      return {
        phase,
        title: "Your piece is ready",
        body: `Samuel arranges delivery with you on WhatsApp. The balance of ${formatNaira(balanceOf(o))} is due on delivery. Let him know once it arrives.`,
        primary: wa("I've received it", `Hello Samuel, I've received my piece for ${ref}. Thank you!`),
        secondary: wa("Message Samuel", `Hello Samuel, about delivery for ${ref}.`),
      };
    case "delivered":
      return {
        phase,
        title: "Delivered. Enjoy your piece.",
        body: "Your certificate of authenticity is in Documents. Balance settled on delivery.",
        primary: { label: "Commission another", href: "/commission?start=1" },
        secondary: { label: "View certificate", href: `/account/orders/${o.id}/documents/certificate` },
      };
    case "cancelled":
    default:
      return {
        phase,
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
  switch (phaseOf(o)) {
    case "reviewing":
      return { title: "Request received", body: `${line} · Samuel is reviewing it` };
    case "quote":
      return { title: "Your quote is ready", body: `${line} · deposit ${formatNaira(o.deposit)}` };
    case "deposit":
      return { title: "Deposit due", body: `${line} · ${formatNaira(o.deposit)} by bank transfer` };
    case "checking":
      return { title: "Transfer sent", body: `${line} · Samuel is checking it` };
    case "sketching":
      return { title: "Deposit received", body: `${line} · sketching starts` };
    case "sketch":
      return { title: "Your sketch is ready", body: `${line} · approve it or ask for changes` };
    case "revising":
      return { title: "Changes requested", body: `${line} · Samuel is revising the sketch` };
    case "drawing":
      return o.status === "CONFIRMED"
        ? { title: "Sketch approved", body: `${line} · shading starts next` }
        : { title: "Samuel started drawing", body: line };
    case "ready":
      return { title: "Your piece is ready", body: `${line} · delivery on WhatsApp` };
    case "delivered":
      return { title: "Delivered", body: `${line} · certificate in Documents` };
    case "cancelled":
    default:
      return { title: "Order cancelled", body: line };
  }
}

/**
 * localStorage key for "this notification has been read". It changes when
 * Samuel moves the order on (status) or shares a new sketch, but not when the
 * customer taps a button themselves (accepting, paying, approving), so their
 * own action never shows up as unread news.
 */
export function notifKey(o: CustomerOrder): string {
  const phase = phaseOf(o);
  const sketch = latestSketch(o);
  if (sketch && (phase === "sketch" || phase === "revising" || (phase === "drawing" && o.status === "CONFIRMED"))) {
    return `${o.id}:sketch:${sketch.id}`;
  }
  return `${o.id}:${o.status}`;
}

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
