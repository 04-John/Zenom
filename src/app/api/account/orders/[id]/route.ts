import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendStudioAlertEmail, type StudioAlert } from "@/lib/email";

// The customer's buttons on their own order (signed in, order on their
// account). Each tap only records a flag and emails Samuel; the order status
// never changes here. Samuel moves the order forward himself, e.g. after he
// has seen the deposit arrive in his bank.
//
//   accept-quote     AWAITING_DEPOSIT              -> quoteAcceptedAt
//   paid             AWAITING_DEPOSIT              -> customerPaidAt (+ quoteAcceptedAt)
//   approve-sketch   CONFIRMED / IN_PRODUCTION, a sketch photo exists, not yet approved
//                                                  -> sketchApprovedAt
//   request-changes  same as approve-sketch, with feedback text
//                                                  -> sketchFeedback, sketchFeedbackAt
//
// Repeating a tap that's already recorded is accepted and changes nothing
// (no second email). Responds with the order's flags as ISO strings.
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept-quote") }),
  z.object({ action: z.literal("paid") }),
  z.object({ action: z.literal("approve-sketch") }),
  z.object({ action: z.literal("request-changes"), feedback: z.string().trim().min(3).max(1000) }),
]);

const SKETCH_STATUSES = ["CONFIRMED", "IN_PRODUCTION"];

const FLAGS = {
  quoteAcceptedAt: true,
  customerPaidAt: true,
  sketchApprovedAt: true,
  sketchFeedback: true,
  sketchFeedbackAt: true,
} as const;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { allowed } = rateLimit(`order-action:${userId}`, 20, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many taps. Please wait a moment and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const error =
      body?.action === "request-changes" ? "Please write a few words about the changes you'd like." : "Something went wrong. Please try again.";
    return NextResponse.json({ error }, { status: 400 });
  }
  const input = parsed.data;

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerName: true,
      customerEmail: true,
      ...FLAGS,
      _count: { select: { photos: { where: { stage: "SKETCH" } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const now = new Date();
  let data: Parameters<typeof prisma.order.update>[0]["data"] | null = null;
  let alert: StudioAlert | null = null;

  switch (input.action) {
    case "accept-quote":
    case "paid": {
      if (order.status !== "AWAITING_DEPOSIT") {
        return NextResponse.json({ error: "This order isn't waiting for a deposit any more." }, { status: 409 });
      }
      if (input.action === "accept-quote" && !order.quoteAcceptedAt) {
        data = { quoteAcceptedAt: now };
        alert = "accepted-quote";
      }
      if (input.action === "paid" && !order.customerPaidAt) {
        data = { customerPaidAt: now, quoteAcceptedAt: order.quoteAcceptedAt ?? now };
        alert = "paid";
      }
      break;
    }
    case "approve-sketch":
    case "request-changes": {
      if (!SKETCH_STATUSES.includes(order.status) || order._count.photos === 0) {
        return NextResponse.json({ error: "There's no sketch to review on this order yet." }, { status: 409 });
      }
      if (order.sketchApprovedAt) {
        if (input.action === "approve-sketch") break; // already approved: nothing to do
        return NextResponse.json({ error: "You've already approved this sketch. Message Samuel on WhatsApp about changes." }, { status: 409 });
      }
      if (input.action === "approve-sketch") {
        data = { sketchApprovedAt: now };
        alert = "approved-sketch";
      } else {
        data = { sketchFeedback: input.feedback, sketchFeedbackAt: now };
        alert = "requested-changes";
      }
      break;
    }
  }

  const flags = data ? await prisma.order.update({ where: { id: order.id }, data, select: FLAGS }) : order;

  if (alert) {
    // Never fails the tap: the flag is saved and shows on the studio order.
    await sendStudioAlertEmail({
      alert,
      orderNumber: order.orderNumber,
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      feedback: input.action === "request-changes" ? input.feedback : null,
    }).catch((err) => console.error("Studio alert email failed:", err));
  }

  return NextResponse.json({
    quoteAcceptedAt: flags.quoteAcceptedAt?.toISOString() ?? null,
    customerPaidAt: flags.customerPaidAt?.toISOString() ?? null,
    sketchApprovedAt: flags.sketchApprovedAt?.toISOString() ?? null,
    sketchFeedback: flags.sketchFeedback ?? null,
    sketchFeedbackAt: flags.sketchFeedbackAt?.toISOString() ?? null,
  });
}
