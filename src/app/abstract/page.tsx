import { getArtworks } from "@/lib/artworks";
import { ProductGrid } from "@/components/product/ProductGrid";
import { MobileGallery } from "@/components/product/mobile/MobileGallery";
import { PageIntro } from "@/components/motion/PageIntro";
import { galleryFilters, galleryIntro, parseStyle } from "@/components/product/gallery";

export const metadata = { title: "Abstract | Zenom Studio" };

// Product listing changes via the admin panel — never statically cache it.
export const dynamic = "force-dynamic";

// `?style=geometric|minimalistic|figurative` picks the opening sub-filter;
// further filtering happens client-side. Below 900px the mobile gallery
// covers every artwork and also understands `?style=all|portrait|abstract`.
export default async function AbstractPage({ searchParams }: { searchParams: { style?: string | string[] } }) {
  const all = await getArtworks();
  const abstract = all.filter((a) => a.category !== "portrait");
  const key = parseStyle(searchParams.style);
  const shown = key === "all" ? abstract : abstract.filter((a) => a.category === key);
  const { filters, info } = galleryFilters(all, "abstract");
  const intro = galleryIntro(key, abstract.length);

  return (
    <>
      <div className="min-[900px]:hidden">
        <MobileGallery works={all} page="abstract" />
      </div>
      <div className="max-[900px]:hidden">
        <PageIntro {...intro} images={shown.slice(0, 5).map((a) => a.imageUrl)} />
        <ProductGrid products={abstract} filters={filters} info={info} initialFilter={key} />
      </div>
    </>
  );
}
