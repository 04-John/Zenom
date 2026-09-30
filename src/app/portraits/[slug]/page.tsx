import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ProductCustomizer } from "@/components/product/ProductCustomizer";
import { Reveal } from "@/components/motion/Reveal";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug } });
  if (!product) return {};
  return {
    title: `${product.name} | Zenom Studio`,
    description: product.description,
    openGraph: { title: product.name, description: product.description },
  };
}

export default async function PortraitDetailPage({ params }: { params: { slug: string } }) {
  const [product, sizes, backgroundTracks] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: params.slug },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    prisma.portraitSize.findMany(),
    prisma.backgroundTrack.findMany(),
  ]);

  if (!product) notFound();

  const mainImage = product.images[0]?.url ?? "/placeholder.jpg";

  return (
    <div className="mx-auto max-w-container px-6 py-12 lg:px-10">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: mainImage,
            offers: {
              "@type": "Offer",
              priceCurrency: "NGN",
              price: (product.basePrice / 100).toFixed(2),
              availability:
                product.status === "AVAILABLE"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />

      <div className="grid gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-navy/5">
            <Image src={mainImage} alt={product.name} fill className="object-cover" priority />
          </div>
        </Reveal>

        <div>
          <Reveal>
            {product.archiveCode && (
              <p className="text-xs uppercase tracking-widest text-charcoal/50">{product.archiveCode}</p>
            )}
            <h1 className="mt-2 font-display text-4xl text-navy">{product.name}</h1>
            <p className="mt-4 text-charcoal/70">{product.description}</p>
          </Reveal>

          <div className="mt-10">
            <ProductCustomizer
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              imageUrl={mainImage}
              basePrice={product.basePrice}
              sizes={sizes.map((s) => ({ id: s.id, label: s.label, priceModifier: s.priceModifier }))}
              backgroundTracks={backgroundTracks.map((t) => ({
                id: t.id,
                label: t.label,
                priceModifier: t.priceModifier,
              }))}
              available={product.status === "AVAILABLE"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
