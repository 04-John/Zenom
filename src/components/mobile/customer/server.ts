// Server-side data for the customer light app: loads the signed-in user's
// orders with Prisma (always scoped to userId) and maps them to the plain
// CustomerOrder shape in ./model.ts. Also loads the four rooms (counts and
// thumbnails) for /commission and the Pricing tab. Import from server
// components only.

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CATALOG, art } from "@/lib/catalog";
import { NOT_COMMISSION, isCommissionSlug, parseCommissionNotes, freeTextNotes } from "@/lib/commission";
import {
  CATEGORY_LABEL,
  SIZES,
  additionalSubjectsPrice,
  artworkPrice,
  fromDbCategory,
  framingPrice,
  type Category,
} from "@/lib/pricing";
import { ago, fmtDate, type OrderStatus } from "@/lib/zenom-mobile";
import { ROOM_KEYS, displayPhoto, type CustomerItem, type CustomerOrder } from "./model";

export const ORDER_INCLUDE = Prisma.validator<Prisma.OrderInclude>()({
  items: {
    include: {
      product: {
        select: {
          name: true,
          slug: true,
          category: true,
          archiveCode: true,
          images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  },
});

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

/** A catalogue image for each room, used when an order has no photo of its own. */
export const ROOM_FALLBACK: Record<Category, string> = {
  portrait: art("w05"),
  geometric: art("g01"),
  minimalistic: art("m01"),
  figurative: art("f01"),
};

/** Only hosts next/image is configured for (local files, Cloudinary, Netlify). */
export function safeImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//") && url !== "/placeholder.jpg") return url;
  if (/^https:\/\/res\.cloudinary\.com\//.test(url)) return url;
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app\//i.test(url)) return url;
  return null;
}

const cleanSize = (label: string | null | undefined) => (label ? label.replace(/x/i, "×") : null);

function breakdownFor(category: Category, sizeIndex: number | null, framed: boolean, subjects: number, unitPrice: number) {
  if (sizeIndex == null || sizeIndex < 0 || sizeIndex >= SIZES.length) return null;
  const artwork = artworkPrice(category, sizeIndex);
  const framing = framingPrice(sizeIndex, framed);
  const extra = additionalSubjectsPrice(category, subjects);
  return artwork + framing + extra === unitPrice ? { artwork, framing, extra } : null;
}

function itemTitle(category: Category, isCommission: boolean, name: string, hasPhoto: boolean) {
  if (!isCommission) return name;
  if (category === "portrait") return hasPhoto ? "Portrait from your photo" : "Portrait commission";
  return `${CATEGORY_LABEL[category]} piece`;
}

export function toCustomerOrder(o: OrderRow, now: number): CustomerOrder {
  const items: CustomerItem[] = o.items.map((it) => {
    const category = fromDbCategory(it.product.category);
    const isCommission = isCommissionSlug(it.product.slug);
    const notes = parseCommissionNotes(it.notes, o.notes);
    const rawPhoto = safeImage(notes.photoUrl);
    const photo = rawPhoto ? displayPhoto(rawPhoto) : null;
    const image = photo ?? safeImage(it.product.images[0]?.url) ?? ROOM_FALLBACK[category];
    return {
      id: it.id,
      title: itemTitle(category, isCommission, it.product.name, !!photo),
      category,
      size: cleanSize(it.sizeLabel),
      sizeIndex: it.sizeIndex,
      framed: it.framed,
      subjectCount: it.subjectCount,
      unitPrice: it.unitPrice,
      breakdown: breakdownFor(category, it.sizeIndex, it.framed, it.subjectCount, it.unitPrice),
      image,
      code: isCommission ? null : it.product.archiveCode,
      medium: notes.medium,
      photoUrl: photo ?? undefined,
      isCommission,
    };
  });

  const first = items[0];
  const commissionNotes = parseCommissionNotes(o.items[0]?.notes, o.notes);
  const title = !first ? "Order" : items.length > 1 ? `${first.title} + ${items.length - 1} more` : first.title;
  const address = o.deliveryAddress === "To confirm on WhatsApp" ? "" : o.deliveryAddress;

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status as OrderStatus,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    requestedLabel: fmtDate(o.createdAt),
    updatedAgo: ago(o.updatedAt, now),
    title,
    size: first?.size ?? null,
    framed: first?.framed ?? false,
    subjectCount: first?.subjectCount ?? 1,
    image: first?.image ?? ROOM_FALLBACK.portrait,
    isCommission: !!first?.isCommission,
    medium: first?.medium,
    neededBy: commissionNotes.neededBy,
    notes: freeTextNotes(o.notes),
    delivery: o.delivery,
    deliveryFee: o.deliveryFee,
    subtotal: o.subtotal,
    total: o.total,
    deposit: o.deposit,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    deliveryAddress: address,
    items,
  };
}

/** Every order of this user, newest first. Never throws: a database hiccup shows an empty list. */
export async function getCustomerOrders(userId: string): Promise<CustomerOrder[]> {
  const now = Date.now();
  try {
    const rows = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: ORDER_INCLUDE,
    });
    return rows.map((r) => toCustomerOrder(r, now));
  } catch (err) {
    console.error("Customer orders failed to load:", err);
    return [];
  }
}

/** One order, only if it belongs to this user (same check as the desktop page). */
export async function getCustomerOrder(userId: string, id: string): Promise<CustomerOrder | null> {
  const row = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!row || row.userId !== userId) return null;
  return toCustomerOrder(row, Date.now());
}

/* ── Rooms: real counts and thumbnails from the catalogue in the database ── */

export type RoomInfo = { key: Category; label: string; title: string; count: number; thumbs: string[] };

const CATALOG_THUMBS: Record<Category, string[]> = {
  portrait: ["w05", "w07", "w08"].map(art),
  geometric: ["g01", "g03", "g02"].map(art),
  minimalistic: ["m01", "m02", "m03"].map(art),
  figurative: ["f01", "f02", "f03"].map(art),
};

export async function getRooms(): Promise<RoomInfo[]> {
  let rows: { category: Parameters<typeof fromDbCategory>[0]; images: { url: string }[] }[] = [];
  let fromDb = false;
  try {
    rows = await prisma.product.findMany({
      where: { status: { in: ["AVAILABLE", "SOLD_OUT"] }, ...NOT_COMMISSION },
      select: { category: true, images: { orderBy: { order: "asc" }, take: 1, select: { url: true } } },
      orderBy: [{ archiveCode: "asc" }, { createdAt: "asc" }],
    });
    fromDb = rows.length > 0;
  } catch (err) {
    console.error("Rooms failed to load, using the catalogue:", err);
  }

  return ROOM_KEYS.map((key) => {
    const mine = rows.filter((r) => fromDbCategory(r.category) === key);
    const count = fromDb ? mine.length : CATALOG.filter((c) => c.category === key).length;
    const thumbs = mine
      .map((r) => safeImage(r.images[0]?.url))
      .filter((u): u is string => !!u)
      .slice(0, 3);
    for (const t of CATALOG_THUMBS[key]) if (thumbs.length < 3 && !thumbs.includes(t)) thumbs.push(t);
    return { key, label: CATEGORY_LABEL[key], title: key === "portrait" ? "Portraits" : CATEGORY_LABEL[key], count, thumbs };
  });
}
