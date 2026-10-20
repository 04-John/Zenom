// The 38 launch artworks. Shared by prisma/seed.ts (to create products) and
// by the storefront (for static hero imagery and fallbacks), so titles,
// codes and image files are defined exactly once.
// Titles were chosen by looking at each piece (renamed from the design
// reference's placeholders). Samuel can rename any of them in /studio/products;
// re-seeding never overwrites a renamed product.
import manifest from "./art-manifest.json";
import cloudinaryUrls from "./art-cloudinary.json";
import type { Category } from "./pricing";

// code ("w01") -> Cloudinary secure_url, written by scripts/upload-art.mjs.
const cloudinary = cloudinaryUrls as Record<string, string>;

export type ArtGroup = {
  prefix: "w" | "g" | "m" | "f";
  category: Category;
  label: string;
  medium: string;
  blurb: string;
  titles: string[];
};

export const ART_GROUPS: ArtGroup[] = [
  {
    prefix: "w",
    category: "portrait",
    label: "Portraits",
    medium: "Charcoal and graphite on paper",
    blurb: "Drawn by hand from your photograph, in your choice of size.",
    titles: ["Blindfold", "Held Gaze", "Veil", "Sidelong Glance", "Quiet Smile", "Bright Grin", "Sun Gazer", "Matriarch", "Facets", "Shades, in Colour", "Shades, in Graphite"],
  },
  {
    prefix: "g",
    category: "geometric",
    label: "Geometric",
    medium: "Colour pencil and ink on paper",
    blurb: "A hand recreation of this reference, or of one you supply.",
    titles: ["Shards", "Mosaic Wheel", "Totem", "Undertow", "Figure in Parts", "Cutaway", "Plume"],
  },
  {
    prefix: "m",
    category: "minimalistic",
    label: "Minimalistic",
    medium: "Pencil and colour pencil on paper",
    blurb: "A hand recreation of this reference, or of one you supply.",
    titles: ["Gaggle", "Quartet", "Stride", "Rainbow Crown", "Reverie", "The Watchers", "One Line", "Profile in Stripes", "Teal & Plum", "Fragments"],
  },
  {
    prefix: "f",
    category: "figurative",
    label: "Figurative",
    medium: "Pencil and colour pencil on paper",
    blurb: "A hand recreation of this reference, or of one you supply.",
    titles: ["Potted Sun", "Cairn", "Tulip & Rose", "Melting Cube", "Lotus on Red", "Peony Suns", "Stained Glass Tree", "Balanced Stones", "Sunrise Ridge", "River Run"],
  },
];

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type CatalogEntry = {
  /** "w01" … "f10" — also the image file name */
  code: string;
  title: string;
  slug: string;
  category: Category;
  medium: string;
  blurb: string;
  /** e.g. "ZS-W01" */
  archiveCode: string;
  src: string;
  width: number;
  height: number;
};

export const CATALOG: CatalogEntry[] = ART_GROUPS.flatMap((g) =>
  g.titles.map((title, i) => {
    const code = `${g.prefix}${String(i + 1).padStart(2, "0")}`;
    const dims = (manifest as Record<string, { width: number; height: number }>)[code] ?? { width: 4, height: 5 };
    return {
      code,
      title,
      slug: slugify(title),
      category: g.category,
      medium: g.medium,
      blurb: g.blurb,
      archiveCode: `ZS-${code.toUpperCase()}`,
      // Cloudinary URL once scripts/upload-art.mjs has run, else the local copy in /public/art.
      src: cloudinary[code] ?? `/art/${code}.jpg`,
      width: dims.width,
      height: dims.height,
    };
  })
);

export const CATALOG_BY_CODE: Record<string, CatalogEntry> = Object.fromEntries(CATALOG.map((c) => [c.code, c]));

/** Static image paths: `art("w05")`. */
export const art = (code: string) => CATALOG_BY_CODE[code]?.src ?? `/art/${code}.jpg`;

/** Samuel's portraits only (w01–w11): the home hero arch uses these. */
export const PORTRAIT_CODES = CATALOG.filter((c) => c.category === "portrait").map((c) => c.code);

/** Natural size of an artwork image given its URL (falls back to 4:5). */
export function dimsForUrl(url: string): { width: number; height: number } {
  const code = url.match(/\/art\/([wgmf]\d\d)\.jpg$/)?.[1];
  return (code && CATALOG_BY_CODE[code]) || { width: 4, height: 5 };
}
