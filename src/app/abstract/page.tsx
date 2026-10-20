import { getArtworks } from "@/lib/artworks";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PageIntro } from "@/components/motion/PageIntro";
import { galleryFilters, galleryIntro, parseStyle } from "@/components/product/gallery";

export const metadata = { title: "Abstract | Zenom Studio" };

// Product listing changes via the admin panel — never statically cache it.
export const dynamic = "force-dynamic";

// `?style=geometric|minimalistic|figurative` picks the opening sub-filter;
// further filtering happens client-side.
export default async function AbstractPage({ searchParams }: { searchParams: { style?: string | string[] } }) {
  const all = await getArtworks();
  const abstract = all.filter((a) => a.category !== "portrait");
  const key = parseStyle(searchParams.style);
  const shown = key === "all" ? abstract : abstract.filter((a) => a.category === key);
  const { filters, info } = galleryFilters(all, "abstract");
  const intro = galleryIntro(key, abstract.length);

  return (
    <>
      <PageIntro {...intro} images={shown.slice(0, 5).map((a) => a.imageUrl)} />
      <ProductGrid products={abstract} filters={filters} info={info} initialFilter={key} />
    </>
  );
}
