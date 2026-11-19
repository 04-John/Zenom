import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkoutSchema, commissionSchema, type CommissionInput } from "@/lib/validation";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { sendOrderEmails } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { fromDbCategory, isPortrait, orderTotals, sizeLabel, toDbCategory, unitPriceFor, type PricedItem } from "@/lib/pricing";
import { MEDIUM_TO_DB, commissionProductName, commissionSlug } from "@/lib/commission";

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

    // The light app's commission request (/commission) shares this endpoint.
    if (body?.kind === "commission") {
      const commission = commissionSchema.safeParse(body);
      if (!commission.success) {
        return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
      }
      return createCommission(commission.data, (session?.user as { id?: string } | undefined)?.id);
    }

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

    const priced: {
      product: (typeof products)[number];
      item: (typeof data.items)[number];
      category: ReturnType<typeof fromDbCategory>;
      pricedItem: PricedItem;
      unitPrice: number;
    }[] = [];
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

    const order = await createWithOrderNumber((orderNumber) =>
      prisma.order.create({
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
      })
    );

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
      { id: order.id, orderNumber: order.orderNumber, whatsappUrl, total: totals.total, deposit: totals.deposit },
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

// ZS-#### numbering: next free number, retrying if two orders race.
async function createWithOrderNumber<T>(create: (orderNumber: string) => Promise<T>): Promise<T> {
  const existing = await prisma.order.count();
  for (let attempt = 0; attempt < 10; attempt++) {
    const orderNumber = `ZS-${String(existing + 1 + attempt).padStart(4, "0")}`;
    try {
      return await create(orderNumber);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  throw new Error("Could not allocate an order number");
}

// Commission request: saved as PENDING (Samuel reviews it and sends the
// quote), priced server-side like any order, and attached to the hidden
// per-category commission product (see src/lib/commission.ts).
async function createCommission(data: CommissionInput, userId: string | undefined) {
  try {
    const category = data.category;
    const product = await prisma.product.upsert({
      where: { slug: commissionSlug(category) },
      update: {},
      create: {
        slug: commissionSlug(category),
        name: commissionProductName(category),
        description: "Placeholder for commission requests made in the app. Not shown on the site.",
        category: toDbCategory(category),
        pillar: isPortrait(category) ? "PORTRAITS" : "ABSTRACT",
        status: "DRAFT",
      },
    });

    const subjectCount = isPortrait(category) ? data.subjectCount : 1;
    const pricedItem = { category, sizeIndex: data.sizeIndex, framed: data.framed, subjectCount };
    const unitPrice = unitPriceFor(pricedItem);
    const totals = orderTotals([pricedItem], data.delivery);
    const email = data.customerEmail?.trim() ?? "";
    const address = data.deliveryAddress?.trim() || "To confirm on WhatsApp";
    const notes = data.notes?.trim() || undefined;
    // WhatsApp message: the "needed by" date travels with the notes.
    const whatsappNotes = [data.neededBy && `Needed by: ${data.neededBy}`, notes].filter(Boolean).join("\n") || undefined;

    const order = await createWithOrderNumber((orderNumber) =>
      prisma.order.create({
        data: {
          orderNumber,
          userId,
          status: "PENDING",
          customerName: data.customerName,
          customerEmail: email,
          customerPhone: data.customerPhone,
          deliveryAddress: address,
          notes,
          neededBy: data.neededBy ? new Date(`${data.neededBy}T00:00:00.000Z`) : null,
          delivery: data.delivery === "kaduna" ? "KADUNA" : "OUTSIDE",
          deliveryFee: totals.delivery,
          subtotal: totals.subtotal,
          total: totals.total,
          deposit: totals.deposit,
          items: {
            create: [
              {
                productId: product.id,
                sizeLabel: sizeLabel(data.sizeIndex),
                sizeIndex: data.sizeIndex,
                framed: data.framed,
                subjectCount,
                medium: MEDIUM_TO_DB[data.medium],
                referencePhotoUrl: data.photoUrl ?? null,
                unitPrice,
                quantity: 1,
                subtotal: unitPrice,
              },
            ],
          },
        },
      })
    );

    const emailResult = await sendOrderEmails({
      orderNumber: order.orderNumber,
      customerEmail: email,
      customerName: order.customerName,
      delivery: data.delivery,
      subtotal: totals.subtotal,
      deliveryFee: totals.delivery,
      total: totals.total,
      deposit: totals.deposit,
      items: [
        {
          title: `${commissionProductName(category)} · ${data.medium}`,
          category,
          sizeIndex: data.sizeIndex,
          framed: data.framed,
          subjectCount,
        },
      ],
    });
    await prisma.order.update({ where: { id: order.id }, data: { emailSent: emailResult.sent } });

    const whatsappUrl = buildWhatsAppLink({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      deliveryAddress: address,
      delivery: data.delivery,
      total: totals.total,
      notes: [whatsappNotes, data.photoUrl && `Reference photo: ${data.photoUrl}`].filter(Boolean).join("\n") || undefined,
      items: [
        {
          title: `${commissionProductName(category)} (${data.medium})`,
          code: "commission",
          size: sizeLabel(data.sizeIndex),
          framed: data.framed,
          subjectCount,
          unitPrice,
        },
      ],
    });

    return NextResponse.json(
      { id: order.id, orderNumber: order.orderNumber, whatsappUrl, total: totals.total, deposit: totals.deposit },
      { status: 201 }
    );
  } catch (err) {
    console.error("Commission request failed:", err);
    return NextResponse.json(
      { error: "Something went wrong while saving your request. Please try again." },
      { status: 500 }
    );
  }
}
