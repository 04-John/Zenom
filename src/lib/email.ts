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

  const customer = await deliver({
    to: params.customerEmail,
    subject: `Order ${params.orderNumber} received — Zenom Studio`,
    html: `${emailHeader()}<p>Hi ${escapeHtml(params.customerName)},</p><p>We've received your order <strong>${params.orderNumber}</strong>. We'll confirm final details with you on WhatsApp shortly.</p>${breakdown}`,
  });

  if (process.env.ORDER_NOTIFICATION_EMAIL) {
    await deliver({
      to: process.env.ORDER_NOTIFICATION_EMAIL,
      replyTo: params.customerEmail,
      subject: `New order ${params.orderNumber}`,
      html: `${emailHeader()}<p>New order from ${escapeHtml(params.customerName)} (${escapeHtml(params.customerEmail)}).</p>${breakdown}`,
    });
  }

  return customer;
}
