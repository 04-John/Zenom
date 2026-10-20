import type { ArtCard } from "@/lib/artworks";
import { ABSTRACT_CATEGORIES, type Category } from "@/lib/pricing";
import type { GalleryFilter, GalleryInfo } from "./ProductGrid";

// Shared by /portraits and /abstract: filter pills, intro copy and intro
// worlds, from the reference's gInfo / introFor. Counts are the real ones.

export type GalleryKey = "all" | Category;

const BLURB: Record<GalleryKey, string> = {
  all: "Geometric, minimalistic and figurative pieces. Graphite and colour-pencil recreations of a chosen or client-supplied reference. Same sizes and framing as Portraits.",
  portrait: "Commissioned charcoal and pencil portraits, made to order from your photograph.",
  geometric: "Hard edges, circles and patterned fills in colour pencil and ink.",
  minimalistic: "Line, flat colour and a lot of quiet space.",
  figurative: "Plants, stones, flowers and landscapes, drawn with patterned line.",
};

const WORLD: Record<GalleryKey, string> = {
  all: "#1B2340",
  portrait: "#171310",
  geometric: "#1B2340",
  minimalistic: "#4A1618",
  figurative: "#15302A",
};

const TITLE: Record<GalleryKey, string> = {
  all: "Abstract",
  portrait: "Portraits",
  geometric: "Geometric",
  minimalistic: "Minimalistic",
  figurative: "Figurative",
};

const pad = (n: number) => String(n);

export function galleryIntro(key: GalleryKey, count: number) {
  const kicker =
    key === "all"
      ? `ABSTRACT — ${pad(count)} WORKS`
      : key === "portrait"
        ? `PORTRAITS — ${pad(count)} WORKS`
        : `ABSTRACT — ${key.toUpperCase()}`;
  return { kicker, title: TITLE[key], blurb: BLURB[key], bg: WORLD[key], ink: "#EFE9DF" };
}

export function parseStyle(value: string | string[] | undefined): GalleryKey {
  const v = Array.isArray(value) ? value[0] : value;
  return (ABSTRACT_CATEGORIES as string[]).includes(v ?? "") ? (v as Category) : "all";
}

export function galleryFilters(all: ArtCard[], page: "portraits" | "abstract") {
  const n = (c: Category) => all.filter((a) => a.category === c).length;
  const abstractTotal = all.filter((a) => a.category !== "portrait").length;
  const filters: GalleryFilter[] = [
    page === "abstract"
      ? { key: "all", label: "All works", count: abstractTotal }
      : { key: "all", label: "All works", count: abstractTotal, href: "/abstract" },
    page === "portraits"
      ? { key: "portrait", label: "Portraits", count: n("portrait"), active: true, href: "/portraits" }
      : { key: "portrait", label: "Portraits", count: n("portrait"), href: "/portraits" },
    ...ABSTRACT_CATEGORIES.map<GalleryFilter>((c) =>
      page === "abstract"
        ? { key: c, label: TITLE[c], count: n(c), categories: [c] }
        : { key: c, label: TITLE[c], count: n(c), href: `/abstract?style=${c}` }
    ),
  ];
  if (page === "abstract") filters[0].categories = [...ABSTRACT_CATEGORIES];
  const info = Object.fromEntries((Object.keys(BLURB) as GalleryKey[]).map((k) => [k, { blurb: BLURB[k] }])) as Record<
    string,
    GalleryInfo
  >;
  return { filters, info };
}
