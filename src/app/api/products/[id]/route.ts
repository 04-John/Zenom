import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productUpdateSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const parsed = productUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const { imageUrl, ...productData } = parsed.data;

  const product = await prisma.product.update({ where: { id: params.id }, data: productData });

  if (imageUrl) {
    const existing = await prisma.productImage.findFirst({
      where: { productId: params.id },
      orderBy: { order: "asc" },
    });
    if (existing) {
      await prisma.productImage.update({ where: { id: existing.id }, data: { url: imageUrl } });
    } else {
      await prisma.productImage.create({
        data: { productId: params.id, url: imageUrl, alt: product.name, order: 0 },
      });
    }
  }

  return NextResponse.json(product);
}
