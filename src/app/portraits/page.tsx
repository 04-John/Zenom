import { getArtworks } from "@/lib/artworks";
import { ProductGrid } from "@/components/product/ProductGrid";
import { MobileGallery } from "@/components/product/mobile/MobileGallery";
import { PageIntro } from "@/components/motion/PageIntro";
import { galleryFilters, galleryIntro } from "@/components/product/gallery";

export const metadata = { title: "Portraits | Zenom Studio" };

// Product listing changes via the admin panel — never statically cache it.
export const dynamic = "force-dynamic";

// Below 900px: "The work." gallery over every artwork, opening on Portraits
// (or `?style=`). From 900px: the desktop intro + masonry, unchanged.
export default async function PortraitsPage() {
  const all = await getArtworks();
  const portraits = all.filter((a) => a.category === "portrait");
  const { filters, info } = galleryFilters(all, "portraits");
  const intro = galleryIntro("portrait", portraits.length);

  return (
    <>
      <div className="min-[900px]:hidden">
        <MobileGallery works={all} page="portraits" />
      </div>
      <div className="max-[900px]:hidden">
        <PageIntro {...intro} images={portraits.slice(0, 5).map((a) => a.imageUrl)} />
        <ProductGrid products={portraits} filters={filters} info={info} initialFilter="portrait" />
      </div>
    </>
  );
}
