import { getArtworks } from "@/lib/artworks";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageIntro } from "@/components/motion/PageIntro";
import { galleryFilters, galleryIntro } from "@/components/product/gallery";

export const metadata = { title: "Portraits | Zenom Studio" };

// Product listing changes via the admin panel — never statically cache it.
export const dynamic = "force-dynamic";

export default async function PortraitsPage() {
  const all = await getArtworks();
  const portraits = all.filter((a) => a.category === "portrait");
  const { filters, info } = galleryFilters(all, "portraits");
  const intro = galleryIntro("portrait", portraits.length);

  return (
    <>
      <PageIntro {...intro} images={portraits.slice(0, 5).map((a) => a.imageUrl)} />
      <ProductGrid products={portraits} filters={filters} info={info} initialFilter="portrait" />
    </>
  );
}
