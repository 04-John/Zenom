import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmail, type StatusEmailInput } from "@/lib/email";
import { ORDER_FLOW, type OrderStatus } from "@/lib/zenom-mobile";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["PENDING", "AWAITING_DEPOSIT", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"]),
});

// The customer is emailed when the order moves FORWARD (or is cancelled).
// Moving it back, e.g. to correct a mis-click, sends nothing, so a
// correction never produces a second "your piece is ready" email.
function shouldEmail(from: OrderStatus, to: OrderStatus): to is StatusEmailInput["status"] {
  if (from === to) return false;
  if (to === "CANCELLED") return true;
  if (from === "CANCELLED") return false;
  return ORDER_FLOW.indexOf(to) > ORDER_FLOW.indexOf(from) && to !== "PENDING";
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const before = await prisma.order.findUnique({ where: { id: params.id }, select: { status: true } });
  if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const order = await prisma.order.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  // Email failures never undo the status change (same rule as new orders).
  let emailed = false;
  const to = parsed.data.status;
  if (order.customerEmail.trim() && shouldEmail(before.status, to)) {
    const result = await sendOrderStatusEmail({
      orderNumber: order.orderNumber,
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: to,
      total: order.total,
      deposit: order.deposit,
      outsideKaduna: order.delivery === "OUTSIDE",
      hasAccount: !!order.userId,
    }).catch((err) => {
      console.error("Status email failed:", err);
      return { sent: false };
    });
    emailed = result.sent;
  }

  return NextResponse.json({ ...order, emailed });
}
