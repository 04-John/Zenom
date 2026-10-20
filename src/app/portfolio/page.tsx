import { Reveal } from "@/components/motion/Reveal";
import { PortfolioGallery, type PortfolioPiece } from "@/components/product/PortfolioGallery";
import { getArtworks } from "@/lib/artworks";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/pricing";

export const metadata = { title: "Portfolio | Zenom Studio" };
export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const artworks = await getArtworks();

  const pieces: PortfolioPiece[] = artworks
    .filter((a) => a.available)
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.name,
      category: CATEGORY_LABEL[a.category],
      imageUrl: a.imageUrl,
      width: a.width,
      height: a.height,
    }));

  // Keep the canonical category order, only showing categories that have work.
  const categories = CATEGORIES.map((c) => CATEGORY_LABEL[c]).filter((label) =>
    pieces.some((p) => p.category === label)
  );

  return (
    <div className="px-6 pb-24 pt-[140px] text-center lg:px-10">
      <Reveal>
        <p className="kicker mb-4">Portfolio</p>
        <h1 className="h-page">A curated collection.</h1>
        <p className="mx-auto mt-6 max-w-lg text-[15px] leading-[1.7] text-ink-2">
          Charcoal, graphite and pencil pieces, each one crafted with intention, patience and precision.
          Click any piece for a closer look.
        </p>
      </Reveal>

      <div className="mx-auto mt-12 max-w-container">
        <PortfolioGallery pieces={pieces} categories={categories} />
      </div>
    </div>
  );
}
