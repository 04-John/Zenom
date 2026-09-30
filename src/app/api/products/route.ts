import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const pillar = req.nextUrl.searchParams.get("pillar") ?? "PORTRAITS";

  const products = await prisma.product.findMany({
    where: { pillar: pillar as any, status: { in: ["AVAILABLE", "SOLD_OUT"] } },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
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

  const body = await req.json();
  // A default Category per pillar is assumed to exist (seeded) —
  // in a fuller build this would resolve/select a real categoryId.
  const category = await prisma.category.findFirst({ where: { pillar: body.pillar } });
  if (!category) {
    return NextResponse.json({ error: "No category found for this pillar. Seed categories first." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { ...body, categoryId: category.id },
  });
  return NextResponse.json(product, { status: 201 });
}
