import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
      html: `<p>Hi ${params.name},</p><p>Please confirm your email to activate your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    });
    return { sent: true };
  } catch (err) {
    console.error("Verification email failed:", err);
    return { sent: false, error: err };
  }
}

// Email failures must never make an order disappear — persist the order
// first (see /api/orders), then attempt email, then log + allow retry.
export async function sendOrderEmails(params: {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping order email send");
    return { sent: false };
  }

  try {
    await resend.emails.send({
      from: "Zenom Studio <orders@zenomstudio.com>",
      to: params.customerEmail,
      subject: `Order ${params.orderNumber} received — Zenom Studio`,
      html: `<p>Hi ${params.customerName},</p><p>We've received your order <strong>${params.orderNumber}</strong>. We'll confirm final pricing and details with you on WhatsApp shortly.</p>`,
    });

    if (process.env.ORDER_NOTIFICATION_EMAIL) {
      await resend.emails.send({
        from: "Zenom Studio <orders@zenomstudio.com>",
        to: process.env.ORDER_NOTIFICATION_EMAIL,
        subject: `New order ${params.orderNumber}`,
        html: `<p>New order from ${params.customerName} — total ₦${(params.totalAmount / 100).toLocaleString()}.</p>`,
      });
    }

    return { sent: true };
  } catch (err) {
    console.error("Order email failed:", err);
    return { sent: false, error: err };
  }
}
