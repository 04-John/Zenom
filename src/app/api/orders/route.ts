import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { sendOrderEmails } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { fromDbCategory, isPortrait, orderTotals, sizeLabel, unitPriceFor } from "@/lib/pricing";

// Order creation, in the required sequence:
// 1. validate  2. save to Postgres  3. attempt email (failure non-fatal)
// 4. build WhatsApp link  5. return to client, which opens WhatsApp.
// Never open WhatsApp before the order is successfully saved.
export async function POST(req: NextRequest) {
  try {
    const { allowed } = rateLimit(`orders:${clientIp(req)}`, 10, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many orders submitted. Please try again shortly." }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
    }
    const data = parsed.data;

    // Every price is recomputed here from src/lib/pricing.ts. Anything
    // price-like in the request body is ignored (the schema strips it).
    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) } },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    });

    const priced = [];
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.status !== "AVAILABLE") {
        return NextResponse.json({ error: "One of the items in your order is no longer available." }, { status: 409 });
      }
      const category = fromDbCategory(product.category);
      if (!isPortrait(category) && item.subjectCount !== 1) {
        return NextResponse.json({ error: "Additional subjects are only available for portraits." }, { status: 400 });
      }
      const pricedItem = { category, sizeIndex: item.sizeIndex, framed: item.framed, subjectCount: item.subjectCount };
      priced.push({ product, item, category, pricedItem, unitPrice: unitPriceFor(pricedItem) });
    }

    const totals = orderTotals(priced.map((p) => p.pricedItem), data.delivery);

    // ZS-#### numbering: next free number, retrying if two orders race.
    const existing = await prisma.order.count();
    let order = null;
    let orderNumber = "";
    for (let attempt = 0; attempt < 10 && !order; attempt++) {
      orderNumber = `ZS-${String(existing + 1 + attempt).padStart(4, "0")}`;
      try {
        order = await prisma.order.create({
          data: {
            orderNumber,
            userId: (session?.user as any)?.id,
            status: "AWAITING_DEPOSIT",
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            deliveryAddress: data.deliveryAddress,
            notes: data.notes,
            delivery: data.delivery === "kaduna" ? "KADUNA" : "OUTSIDE",
            deliveryFee: totals.delivery,
            subtotal: totals.subtotal,
            total: totals.total,
            deposit: totals.deposit,
            items: {
              create: priced.map(({ product, item, unitPrice }) => ({
                productId: product.id,
                sizeLabel: sizeLabel(item.sizeIndex),
                sizeIndex: item.sizeIndex,
                framed: item.framed,
                subjectCount: item.subjectCount,
                notes: item.notes,
                unitPrice,
                quantity: 1,
                subtotal: unitPrice,
              })),
            },
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
        throw err;
      }
    }
    if (!order) throw new Error("Could not allocate an order number");

    const emailResult = await sendOrderEmails({
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      delivery: data.delivery,
      subtotal: totals.subtotal,
      deliveryFee: totals.delivery,
      total: totals.total,
      deposit: totals.deposit,
      items: priced.map(({ product, item, category }) => ({
        title: product.name,
        category,
        sizeIndex: item.sizeIndex,
        framed: item.framed,
        subjectCount: item.subjectCount,
      })),
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { emailSent: emailResult.sent },
    });

    const whatsappUrl = buildWhatsAppLink({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      deliveryAddress: order.deliveryAddress,
      delivery: data.delivery,
      total: totals.total,
      notes: order.notes,
      items: priced.map(({ product, item, unitPrice }) => ({
        title: product.name,
        code: product.archiveCode ?? product.slug,
        size: sizeLabel(item.sizeIndex),
        framed: item.framed,
        subjectCount: item.subjectCount,
        unitPrice,
      })),
    });

    return NextResponse.json(
      { orderNumber: order.orderNumber, whatsappUrl, total: totals.total, deposit: totals.deposit },
      { status: 201 }
    );
  } catch (err) {
    console.error("Order creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong while saving your order. Please try again." },
      { status: 500 }
    );
  }
}
