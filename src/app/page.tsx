import type { Metadata } from "next";
import { ChapterTracker } from "@/components/motion/ChapterTracker";
import { ChapterConfirm } from "@/components/home/ChapterConfirm";
import { ChapterRooms } from "@/components/home/ChapterRooms";
import { ChapterSize } from "@/components/home/ChapterSize";
import { ChapterSketch } from "@/components/home/ChapterSketch";
import { ChapterWall } from "@/components/home/ChapterWall";
import { Hero } from "@/components/home/Hero";
import { MobileHome } from "@/components/home/mobile/MobileHome";
import type { HeroSlide } from "@/components/home/mobile/MobileHero";
import { artHref } from "@/lib/artworks";
import { NOT_COMMISSION } from "@/lib/commission";
import { fromDbCategory } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Zenom Studio | More than a portrait",
  description: "Commissioned charcoal, pencil and colour-pencil work, drawn by hand by Samuel in Kaduna.",
};

// Rebuilt at most every 5 minutes; saving an artwork in the studio refreshes
// it straight away (the product API calls revalidatePath("/")).
export const revalidate = 300;

const MAX_SLIDES = 6;
// next/image only serves the hosts in next.config (local files, Cloudinary, *.netlify.app).
const SERVABLE = /^(\/(?!\/)|https:\/\/res\.cloudinary\.com\/|https:\/\/[a-z0-9-]+\.netlify\.app\/)/i;

/** Artworks marked "Show on home page" in the studio, for the phone hero. Never throws. */
async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { featured: true, status: { not: "DRAFT" }, images: { some: {} }, ...NOT_COMMISSION },
      orderBy: { updatedAt: "desc" },
      take: MAX_SLIDES,
      select: { id: true, slug: true, name: true, category: true, images: { orderBy: { order: "asc" }, take: 1, select: { url: true } } },
    });
    return rows.flatMap((p) => {
      const src = p.images[0]?.url;
      if (!src || !SERVABLE.test(src)) return [];
      return [{ key: p.id, src, alt: `${p.name}, drawn by Samuel`, title: p.name, href: artHref(fromDbCategory(p.category), p.slug) }];
    });
  } catch (err) {
    // e.g. a build that runs before the database has the featured column: the hero keeps its built-in slides.
    console.error("Home hero: featured artworks could not be loaded.", err);
    return [];
  }
}

// Below 900px the minimal mobile home replaces the pinned scroll chapters;
// CSS alone decides which tree shows, so server and client markup match.
export default async function HomePage() {
  const heroSlides = await getHeroSlides();
  return (
    <>
      <div className="min-[900px]:hidden">
        <MobileHome heroSlides={heroSlides} />
      </div>
      <div className="relative max-[900px]:hidden">
        <ChapterTracker chapters={["01 SKETCH", "02 ROOMS", "03 SIZE", "04 CONFIRM", "05 YOUR WALL"]} />
        <Hero />
        <ChapterSketch />
        <ChapterRooms />
        <ChapterSize />
        <ChapterConfirm />
        <ChapterWall />
      </div>
    </>
  );
}
