import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../../ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-[140px]">
      <h1 className="h-section">Edit Product</h1>
      <ProductForm initial={product} />
    </div>
  );
}
