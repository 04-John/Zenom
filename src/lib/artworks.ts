import { prisma } from "@/lib/prisma";
import { dimsForUrl } from "@/lib/catalog";
import { fromDbCategory, startingPrice, type Category } from "@/lib/pricing";

// Server-side helpers that turn Product rows into the plain, serialisable
// shape the storefront components use. Prices are never read from the DB.

export type ArtCard = {
  id: string;
  slug: string;
  name: string;
  /** archive code, e.g. "ZS-W05" */
  code: string;
  description: string;
  category: Category;
  imageUrl: string;
  width: number;
  height: number;
  available: boolean;
  /** "from" price in kobo (smallest size, category table) */
  from: number;
  href: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  archiveCode: string | null;
  category: Parameters<typeof fromDbCategory>[0];
  status: string;
  images: { url: string }[];
};

export const artHref = (category: Category, slug: string) =>
  category === "portrait" ? `/portraits/${slug}` : `/abstract/${slug}`;

export function toArtCard(p: ProductRow): ArtCard {
  const category = fromDbCategory(p.category);
  const imageUrl = p.images[0]?.url ?? "/placeholder.jpg";
  const { width, height } = dimsForUrl(imageUrl);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    code: p.archiveCode ?? p.slug,
    description: p.description,
    category,
    imageUrl,
    width,
    height,
    available: p.status === "AVAILABLE",
    from: startingPrice(category),
    href: artHref(category, p.slug),
  };
}

const CATEGORY_ORDER: Category[] = ["portrait", "geometric", "minimalistic", "figurative"];

/** Published artworks (available or sold out), grouped by category then archive code. */
export async function getArtworks(categories?: Category[]): Promise<ArtCard[]> {
  const rows = await prisma.product.findMany({
    where: {
      status: { in: ["AVAILABLE", "SOLD_OUT"] },
      ...(categories && { category: { in: categories.map((c) => c.toUpperCase() as any) } }),
    },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: [{ archiveCode: "asc" }, { createdAt: "asc" }],
  });
  return rows
    .map(toArtCard)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
}

export async function getArtworkBySlug(slug: string) {
  const row = await prisma.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { order: "asc" } } },
  });
  return row ? { card: toArtCard(row), row } : null;
}
