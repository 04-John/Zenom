import nodemailer from "nodemailer";
import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/site";
import {
  additionalSubjectsPrice,
  artworkPrice,
  formatNaira,
  framingPrice,
  sizeLabel,
  type Category,
  type DeliveryZone,
} from "@/lib/pricing";
import type { BankDetails } from "@/lib/studio-info";

// Two ways to send, picked by which env vars are set:
//   1. Gmail SMTP (free, no domain needed): GMAIL_APP_PASSWORD (+ optional GMAIL_USER)
//   2. Resend (needs a verified domain): RESEND_API_KEY (+ optional EMAIL_FROM)
// Gmail wins if both are set.
const GMAIL_USER = process.env.GMAIL_USER || CONTACT_EMAIL;
const smtp = process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;
const resend = !smtp && process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const RESEND_FROM = process.env.EMAIL_FROM || "Zenom Studio <orders@zenomstudio.com>";

type Mail = { to: string; subject: string; html: string; replyTo?: string };

// Spam filters distrust HTML-only mail. Every message also carries a plain-text
// version (made from the HTML, with link URLs kept) and a full HTML document.
const toText = (html: string) =>
  html
    .replace(/<img[^>]*>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_m, href, label) => (label === href ? href : `${label}: ${href}`))
    .replace(/<\/(p|li|ul|div)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const wrapHtml = (body: string) =>
  `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#222">${body}<p style="margin-top:28px;color:#777;font-size:12px">Zenom Studio, Kaduna, Nigeria. Questions? Just reply to this email.</p></body></html>`;

async function deliver(raw: Mail): Promise<{ sent: boolean; error?: unknown }> {
  const mail = { ...raw, text: toText(raw.html), html: wrapHtml(raw.html) };
  try {
    if (smtp) {
      await smtp.sendMail({
        from: `Zenom Studio <${GMAIL_USER}>`,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        replyTo: mail.replyTo,
      });
      return { sent: true };
    }
    if (resend) {
      // The Resend SDK returns failures (e.g. unverified domain) instead of throwing.
      const { error } = await resend.emails.send({
        from: RESEND_FROM,
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        reply_to: mail.replyTo,
      });
      if (error) {
        console.error("Email failed:", error);
        return { sent: false, error };
      }
      return { sent: true };
    }
    console.warn("No email provider configured (set GMAIL_APP_PASSWORD or RESEND_API_KEY) — email not sent");
    return { sent: false };
  } catch (err) {
    console.error("Email failed:", err);
    return { sent: false, error: err };
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Email clients don't render SVG, so the header uses a PNG at an absolute URL.
const SITE_URL = (process.env.NEXTAUTH_URL || "https://zenomstudio.netlify.app").replace(/\/$/, "");
const emailHeader = () =>
  `<p style="margin:0 0 20px"><img src="${SITE_URL}/brand/zenom-mark-dark.png" alt="Zenom Studio" width="56" height="56" style="display:block;border:0" /></p>`;

// Signup verification link must be clicked before the account can log in
// — see src/lib/auth.ts authorize() and /api/auth/verify-email.
export async function sendVerificationEmail(params: { email: string; name: string; token: string }) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${params.token}&email=${encodeURIComponent(params.email)}`;

  return deliver({
    to: params.email,
    subject: "Verify your Zenom Studio account",
    html: `${emailHeader()}<p>Hi ${escapeHtml(params.name)},</p><p>Thanks for creating a Zenom Studio account. Please confirm your email address to finish setting it up.</p><p><a href="${verifyUrl}">Confirm my email</a></p><p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
  });
}

export type OrderEmailInput = {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  delivery: DeliveryZone;
  subtotal: number; // kobo
  deliveryFee: number;
  total: number;
  deposit: number;
  items: { title: string; category: Category; sizeIndex: number; framed: boolean; subjectCount: number }[];
};

function breakdownHtml(p: OrderEmailInput): string {
  const rows = p.items
    .map((i) => {
      const lines = [
        `${sizeLabel(i.sizeIndex)} in artwork — ${formatNaira(artworkPrice(i.category, i.sizeIndex))}`,
        i.framed ? `Framing — ${formatNaira(framingPrice(i.sizeIndex, true))}` : "Unframed",
        ...(i.subjectCount > 1
          ? [`${i.subjectCount - 1} additional subject${i.subjectCount > 2 ? "s" : ""} — ${formatNaira(additionalSubjectsPrice(i.category, i.subjectCount))}`]
          : []),
      ];
      return `<li><strong>${escapeHtml(i.title)}</strong><br>${lines.join("<br>")}</li>`;
    })
    .join("");

  const delivery =
    p.delivery === "kaduna"
      ? `Delivery within Kaduna: ${formatNaira(p.deliveryFee)}`
      : "Delivery outside Kaduna: quoted on WhatsApp (not included in the total)";

  return `<ul>${rows}</ul>
<p>Subtotal: ${formatNaira(p.subtotal)}<br>${delivery}<br><strong>Total: ${formatNaira(p.total)}</strong></p>
<p>A 50% non-refundable deposit of <strong>${formatNaira(p.deposit)}</strong> is required before production begins.</p>`;
}

// Contact-form message -> the studio inbox. replyTo is the visitor, so hitting
// "Reply" in Gmail answers them directly.
export async function sendContactMessage(params: { name: string; email: string; phone?: string; message: string }) {
  return deliver({
    to: process.env.CONTACT_NOTIFICATION_EMAIL || CONTACT_EMAIL,
    replyTo: params.email,
    subject: `Website message from ${params.name}`,
    html: `${emailHeader()}<p><strong>${escapeHtml(params.name)}</strong> (${escapeHtml(params.email)}${
      params.phone ? `, ${escapeHtml(params.phone)}` : ""
    }) wrote:</p><p style="white-space:pre-wrap">${escapeHtml(params.message)}</p>`,
  });
}

// Email failures must never make an order disappear — persist the order
// first (see /api/orders), then attempt email, then log + allow retry.
export async function sendOrderEmails(params: OrderEmailInput) {
  const breakdown = breakdownHtml(params);
  // Commission requests from the app may come without an email (WhatsApp only).
  const hasEmail = params.customerEmail.trim().length > 0;

  const customer = hasEmail
    ? await deliver({
        to: params.customerEmail,
        subject: `Order ${params.orderNumber} received — Zenom Studio`,
        html: `${emailHeader()}<p>Hi ${escapeHtml(params.customerName)},</p><p>We've received your order <strong>${params.orderNumber}</strong>. We'll confirm final details with you on WhatsApp shortly.</p>${breakdown}`,
      })
    : { sent: false };

  if (process.env.ORDER_NOTIFICATION_EMAIL) {
    await deliver({
      to: process.env.ORDER_NOTIFICATION_EMAIL,
      replyTo: hasEmail ? params.customerEmail : undefined,
      subject: `New order ${params.orderNumber}`,
      html: `${emailHeader()}<p>New order from ${escapeHtml(params.customerName)}${hasEmail ? ` (${escapeHtml(params.customerEmail)})` : " (no email, WhatsApp only)"}.</p>${breakdown}`,
    });
  }

  return customer;
}

// Password reset link (see /api/auth/forgot-password). Valid for one hour.
export async function sendPasswordResetEmail(params: { email: string; name?: string | null; token: string }) {
  const url = `${SITE_URL}/reset-password?token=${params.token}`;
  return deliver({
    to: params.email,
    subject: "Reset your Zenom Studio password",
    html: `${emailHeader()}<p>Hi ${escapeHtml(params.name || "there")},</p><p>Someone (hopefully you) asked to reset the password for this Zenom Studio account. Choose a new one here:</p><p><a href="${url}">${url}</a></p><p>The link works once and expires in 1 hour. If you didn't ask for this, you can ignore this email: your password stays the same.</p>`,
  });
}

// One email per step Samuel moves an order forward in the studio (see
// PATCH /api/orders/[id]). Order updates are transactional, so they are
// always sent when the order has an email address.
export type StatusEmailInput = {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  status: "AWAITING_DEPOSIT" | "CONFIRMED" | "IN_PRODUCTION" | "READY" | "COMPLETED" | "CANCELLED";
  total: number; // kobo
  deposit: number; // kobo
  outsideKaduna: boolean;
  /** true when the order is attached to an account, so the account link works */
  hasAccount: boolean;
  /** Studio bank details (Studio tab); null until Samuel fills them in. */
  bank: BankDetails | null;
};

export async function sendOrderStatusEmail(p: StatusEmailInput) {
  const ref = escapeHtml(p.orderNumber);
  const balance = p.total - p.deposit;
  const deliveryNote = p.outsideKaduna ? " Delivery outside Kaduna is quoted separately on WhatsApp." : "";
  const copy: Record<StatusEmailInput["status"], { subject: string; body: string }> = {
    AWAITING_DEPOSIT: {
      subject: `Your quote is ready (${p.orderNumber})`,
      body: `<p>Samuel has reviewed your order <strong>${ref}</strong>. The total is <strong>${formatNaira(p.total)}</strong>.${deliveryNote}</p><p>A 50% non-refundable deposit of <strong>${formatNaira(p.deposit)}</strong> starts the work.</p>${
        p.bank
          ? `<p>Pay by bank transfer to:<br><strong>${escapeHtml(p.bank.accountName)}</strong><br>${escapeHtml(p.bank.bank)} · ${escapeHtml(p.bank.accountNumber)}<br>Please use <strong>${ref}</strong> as the transfer reference.</p>`
          : `<p>Samuel will send the payment details on WhatsApp; please use ${ref} as the transfer reference.</p>`
      }${p.hasAccount ? `<p>Once you've paid, tap <em>I've made the transfer</em> on your order so Samuel knows to check.</p>` : ""}`,
    },
    CONFIRMED: {
      subject: `Deposit received (${p.orderNumber})`,
      body: `<p>Thank you, your deposit for <strong>${ref}</strong> has arrived and your order is confirmed. Samuel will share the sketch ${
        p.hasAccount ? "on your order page" : "on WhatsApp"
      } for your approval before the shading starts.</p>`,
    },
    IN_PRODUCTION: {
      subject: `Samuel has started drawing (${p.orderNumber})`,
      body: `<p>Your piece for <strong>${ref}</strong> is now being drawn by hand. We'll let you know as soon as it's ready.</p>`,
    },
    READY: {
      subject: `Your piece is ready (${p.orderNumber})`,
      body: `<p>Your piece for <strong>${ref}</strong> is finished. The balance of <strong>${formatNaira(balance)}</strong> is due on delivery. Samuel will arrange the delivery with you on WhatsApp.</p>`,
    },
    COMPLETED: {
      subject: `Delivered, thank you (${p.orderNumber})`,
      body: `<p>Your order <strong>${ref}</strong> is delivered and paid in full. Thank you for commissioning Zenom Studio; we hope you love it.</p>`,
    },
    CANCELLED: {
      subject: `Order cancelled (${p.orderNumber})`,
      body: `<p>Your order <strong>${ref}</strong> has been cancelled. If you have any questions, reply to Samuel on WhatsApp.</p>`,
    },
  };
  const { subject, body } = copy[p.status];
  const link = p.hasAccount
    ? `<p><a href="${SITE_URL}/account/orders/${encodeURIComponent(p.orderId)}">See your order</a></p>`
    : `<p>Create an account with this email address to follow your orders online: <a href="${SITE_URL}/signup">${SITE_URL}/signup</a></p>`;

  return deliver({
    to: p.customerEmail,
    subject: `${subject} — Zenom Studio`,
    html: `${emailHeader()}<p>Hi ${escapeHtml(p.customerName)},</p>${body}${link}`,
  });
}

// First sketch photo on an order (POST /api/orders/[id]/photos): ask the
// customer to approve it or ask for changes before the shading starts.
export async function sendSketchReadyEmail(p: {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  hasAccount: boolean;
}) {
  const ref = escapeHtml(p.orderNumber);
  const action = p.hasAccount
    ? `<p><a href="${SITE_URL}/account/orders/${encodeURIComponent(p.orderId)}">See the sketch and approve it</a>, or ask for changes, before Samuel starts shading.</p>`
    : `<p>Reply to Samuel on WhatsApp to approve it or ask for changes before he starts shading. Create an account with this email address to see the sketch online: <a href="${SITE_URL}/signup">${SITE_URL}/signup</a></p>`;
  return deliver({
    to: p.customerEmail,
    subject: `Your sketch is ready (${p.orderNumber}) — Zenom Studio`,
    html: `${emailHeader()}<p>Hi ${escapeHtml(p.customerName)},</p><p>Samuel has finished the sketch for <strong>${ref}</strong>.</p>${action}`,
  });
}

// A customer tapped a button on their order (POST /api/account/orders/[id]).
// The tap never changes the order status; this tells Samuel to act on it.
export type StudioAlert = "accepted-quote" | "paid" | "approved-sketch" | "requested-changes";

export async function sendStudioAlertEmail(p: {
  alert: StudioAlert;
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  feedback?: string | null;
}) {
  const who = escapeHtml(p.customerName);
  const copy: Record<StudioAlert, { subject: string; body: string }> = {
    "accepted-quote": { subject: `Quote accepted: ${p.orderNumber}`, body: `<p>${who} accepted the quote. The deposit should follow.</p>` },
    paid: {
      subject: `Customer says they've paid: ${p.orderNumber}`,
      body: `<p>${who} says they've transferred the deposit. Check your bank, then mark the deposit received in the studio.</p>`,
    },
    "approved-sketch": { subject: `Sketch approved: ${p.orderNumber}`, body: `<p>${who} approved the sketch. You can start shading.</p>` },
    "requested-changes": {
      subject: `Sketch changes requested: ${p.orderNumber}`,
      body: `<p>${who} asked for changes to the sketch:</p><blockquote style="white-space:pre-wrap;margin:0 0 16px;padding-left:12px;border-left:3px solid #E58A52">${escapeHtml(p.feedback ?? "")}</blockquote>`,
    },
  };
  const { subject, body } = copy[p.alert];
  return deliver({
    to: process.env.ORDER_NOTIFICATION_EMAIL || CONTACT_EMAIL,
    replyTo: p.customerEmail.trim() || undefined,
    subject,
    html: `${emailHeader()}${body}<p><a href="${SITE_URL}/studio/orders/${encodeURIComponent(p.orderId)}">Open ${escapeHtml(p.orderNumber)} in the studio</a></p>`,
  });
}
