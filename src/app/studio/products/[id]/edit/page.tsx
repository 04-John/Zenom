import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "../../ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!product) notFound();

  return (
    <div className="max-w-2xl pb-24 pt-8">
      <h1 className="h-section">Edit artwork</h1>
      <ProductForm initial={product} />
    </div>
  );
}
