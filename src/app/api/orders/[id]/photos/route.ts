import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSketchReadyEmail } from "@/lib/email";

// Samuel adds a progress photo (sketch / shading / finished) to an order.
// The browser uploads the file to Cloudinary first (uploadImage(file,
// "progress"), signed by /api/uploads/signature), then posts the URL here.
// The first sketch photo emails the customer to approve it.
const schema = z.object({
  stage: z.enum(["SKETCH", "SHADING", "FINISHED"]),
  url: z
    .string()
    .max(2000)
    .regex(/^https:\/\/res\.cloudinary\.com\/[^/\s]+\/image\/upload\/\S+$/),
});

const MAX_PHOTOS = 40;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That photo couldn't be added." }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      userId: true,
      customerName: true,
      customerEmail: true,
      photos: { select: { stage: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status === "CANCELLED") return NextResponse.json({ error: "This order is cancelled." }, { status: 409 });
  if (order.photos.length >= MAX_PHOTOS) {
    return NextResponse.json({ error: `An order can hold up to ${MAX_PHOTOS} photos. Remove one first.` }, { status: 409 });
  }

  const photo = await prisma.orderPhoto.create({
    data: { orderId: order.id, stage: parsed.data.stage, url: parsed.data.url },
  });

  let emailed = false;
  const firstSketch = parsed.data.stage === "SKETCH" && !order.photos.some((p) => p.stage === "SKETCH");
  if (firstSketch && order.customerEmail.trim()) {
    const result = await sendSketchReadyEmail({
      orderNumber: order.orderNumber,
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      hasAccount: !!order.userId,
    }).catch((err) => {
      console.error("Sketch email failed:", err);
      return { sent: false };
    });
    emailed = result.sent;
  }

  return NextResponse.json(
    { id: photo.id, stage: photo.stage, url: photo.url, createdAt: photo.createdAt.toISOString(), emailed },
    { status: 201 }
  );
}
