import { Resend } from "resend";
import {
  additionalSubjectsPrice,
  artworkPrice,
  formatNaira,
  framingPrice,
  sizeLabel,
  type Category,
  type DeliveryZone,
} from "@/lib/pricing";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Email clients don't render SVG, so the header uses a PNG at an absolute URL.
const SITE_URL = (process.env.NEXTAUTH_URL || "https://zenom-studio.netlify.app").replace(/\/$/, "");
const emailHeader = () =>
  `<p style="margin:0 0 20px"><img src="${SITE_URL}/brand/zenom-mark-dark.png" alt="Zenom Studio" width="56" height="56" style="display:block;border:0" /></p>`;

// Signup verification link must be clicked before the account can log in
// — see src/lib/auth.ts authorize() and /api/auth/verify-email.
export async function sendVerificationEmail(params: { email: string; name: string; token: string }) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping verification email send");
    return { sent: false };
  }

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${params.token}&email=${encodeURIComponent(params.email)}`;

  try {
    await resend.emails.send({
      from: "Zenom Studio <orders@zenomstudio.com>",
      to: params.email,
      subject: "Verify your Zenom Studio account",
      html: `${emailHeader()}<p>Hi ${escapeHtml(params.name)},</p><p>Please confirm your email to activate your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    });
    return { sent: true };
  } catch (err) {
    console.error("Verification email failed:", err);
    return { sent: false, error: err };
  }
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

// Email failures must never make an order disappear — persist the order
// first (see /api/orders), then attempt email, then log + allow retry.
export async function sendOrderEmails(params: OrderEmailInput) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order email send");
    return { sent: false };
  }

  const breakdown = breakdownHtml(params);

  try {
    await resend.emails.send({
      from: "Zenom Studio <orders@zenomstudio.com>",
      to: params.customerEmail,
      subject: `Order ${params.orderNumber} received — Zenom Studio`,
      html: `${emailHeader()}<p>Hi ${escapeHtml(params.customerName)},</p><p>We've received your order <strong>${params.orderNumber}</strong>. We'll confirm final details with you on WhatsApp shortly.</p>${breakdown}`,
    });

    if (process.env.ORDER_NOTIFICATION_EMAIL) {
      await resend.emails.send({
        from: "Zenom Studio <orders@zenomstudio.com>",
        to: process.env.ORDER_NOTIFICATION_EMAIL,
        subject: `New order ${params.orderNumber}`,
        html: `${emailHeader()}<p>New order from ${escapeHtml(params.customerName)} (${escapeHtml(params.customerEmail)}).</p>${breakdown}`,
      });
    }

    return { sent: true };
  } catch (err) {
    console.error("Order email failed:", err);
    return { sent: false, error: err };
  }
}
