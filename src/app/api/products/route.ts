import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validation";
import { fromDbCategory, pillarFor } from "@/lib/pricing";

// Public listing. Filter with ?category=PORTRAIT|GEOMETRIC|MINIMALISTIC|FIGURATIVE
// or ?pillar=PORTRAITS|ABSTRACT (default PORTRAITS). Prices are not part of
// the product — they come from src/lib/pricing.ts.
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const pillar = req.nextUrl.searchParams.get("pillar") ?? "PORTRAITS";

  const products = await prisma.product.findMany({
    where: {
      ...(category ? { category: category as any } : { pillar: pillar as any }),
      status: { in: ["AVAILABLE", "SOLD_OUT"] },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      pillar: true,
      status: true,
      archiveCode: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true, alt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const { imageUrl, ...productData } = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        ...productData,
        pillar: pillarFor(fromDbCategory(productData.category)),
        ...(imageUrl && { images: { create: [{ url: imageUrl, alt: productData.name, order: 0 }] } }),
      },
    });
    if (product.featured) revalidatePath("/");
    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Another artwork already uses that slug. Change it and try again." }, { status: 409 });
    }
    throw e;
  }
}
