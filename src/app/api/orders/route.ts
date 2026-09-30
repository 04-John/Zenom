import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { sendOrderEmails } from "@/lib/email";

// Order creation, in the required sequence:
// 1. validate  2. save to Postgres  3. attempt email (failure non-fatal)
// 4. build WhatsApp link  5. return to client, which opens WhatsApp.
// Never open WhatsApp before the order is successfully saved.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
    }
    const data = parsed.data;

    // Re-fetch real prices server-side — never trust client-submitted totals.
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const sizeIds = data.items.map((i) => i.sizeId).filter(Boolean) as string[];
    const trackIds = data.items.map((i) => i.backgroundTrackId).filter(Boolean) as string[];
    const [sizes, tracks] = await Promise.all([
      prisma.portraitSize.findMany({ where: { id: { in: sizeIds } } }),
      prisma.backgroundTrack.findMany({ where: { id: { in: trackIds } } }),
    ]);

    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.status !== "AVAILABLE") {
        return NextResponse.json(
          { error: "One of the items in your order is no longer available." },
          { status: 409 }
        );
      }
    }

    const itemsWithPricing = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const size = sizes.find((s) => s.id === item.sizeId);
      const track = tracks.find((t) => t.id === item.backgroundTrackId);
      const unitPrice = product.basePrice + (size?.priceModifier ?? 0) + (track?.priceModifier ?? 0);
      return { product, size, track, item, subtotal: unitPrice * item.quantity };
    });

    const totalAmount = itemsWithPricing.reduce((sum, i) => sum + i.subtotal, 0);
    const orderNumber = `ZS-${Date.now().toString().slice(-6)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: (session?.user as any)?.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        notes: data.notes,
        totalAmount,
        items: {
          create: itemsWithPricing.map(({ product, size, track, item, subtotal }) => ({
            productId: product.id,
            sizeId: size?.id,
            backgroundTrackId: track?.id,
            quantity: item.quantity,
            notes: item.notes,
            subtotal,
          })),
        },
      },
    });

    const emailResult = await sendOrderEmails({
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { emailSent: emailResult.sent },
    });

    const whatsappUrl = buildWhatsAppLink({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      items: itemsWithPricing.map(({ product, size, track, item }) => ({
        productName: product.name,
        size: size?.label,
        backgroundTrack: track?.label,
        quantity: item.quantity,
      })),
    });

    return NextResponse.json({ orderNumber: order.orderNumber, whatsappUrl }, { status: 201 });
  } catch (err) {
    console.error("Order creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong while saving your order. Please try again." },
      { status: 500 }
    );
  }
}
