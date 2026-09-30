import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Reveal } from "@/components/motion/Reveal";

export const metadata = { title: "Portraits | Zenom Studio" };

// Product listing changes via the admin panel — never statically cache
// this at build time. Without this, Next treats the page as static-
// eligible (no cookies()/headers() call) and prerenders it at build
// time, which both bakes in stale data and fails the build outright if
// the database happens to be unreachable during that build.
export const dynamic = "force-dynamic";

export default async function PortraitsPage() {
  const products = await prisma.product.findMany({
    where: { pillar: "PORTRAITS", status: { in: ["AVAILABLE", "SOLD_OUT"] } },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const cards = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    imageUrl: p.images[0]?.url ?? "/placeholder.jpg",
    basePrice: p.basePrice,
    status: p.status,
    archiveCode: p.archiveCode,
  }));

  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
      <Reveal>
        <h1 className="font-display text-4xl text-navy">Portraits</h1>
        <p className="mt-2 max-w-lg text-charcoal/70">
          Commissioned charcoal and pencil portraits — each one made to order.
        </p>
      </Reveal>
      <div className="mt-12">
        <ProductGrid products={cards} />
      </div>
    </div>
  );
}
