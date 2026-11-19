import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MobileProductForm } from "@/components/mobile/studio/MobileProductForm";
import { ProductForm } from "../../ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!product) notFound();

  return (
    <>
      {/* Light studio app below 900px. */}
      <MobileProductForm
        initial={{
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category,
          status: product.status,
          archiveCode: product.archiveCode,
          imageUrl: product.images[0]?.url ?? null,
          featured: product.featured,
        }}
      />
      <div className="max-w-2xl pb-24 pt-8 max-[900px]:hidden">
        <h1 className="h-section">Edit artwork</h1>
        <ProductForm initial={product} />
      </div>
    </>
  );
}
