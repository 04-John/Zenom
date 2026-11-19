// Commission requests (the light app's 4-step "Start a commission" flow).
//
// A commission is not tied to an artwork in the catalogue: the customer picks
// a room (category), a medium, a size and sends a photo. To keep the schema
// unchanged (no migration on the live database), each request is saved as an
// ordinary Order with one OrderItem that points at a hidden, per-category
// "commission" Product (status DRAFT, slug "commission-<category>", created on
// first use by /api/orders). Everything that reads orders (studio stats,
// emails, order pages) keeps working, and category revenue stays correct.
// The medium and the reference-photo URL live in the item's notes; the
// "needed by" date lives in the order notes. This module is client-safe.

import { CATEGORY_LABEL, type Category } from "@/lib/pricing";

export const COMMISSION_SLUG_PREFIX = "commission-";

export const MEDIUMS = ["Charcoal", "Graphite", "Colour pencil"] as const;
export type Medium = (typeof MEDIUMS)[number];

export const commissionSlug = (category: Category) => `${COMMISSION_SLUG_PREFIX}${category}`;
export const isCommissionSlug = (slug: string | null | undefined) => !!slug?.startsWith(COMMISSION_SLUG_PREFIX);
export const commissionProductName = (category: Category) => `Commission · ${CATEGORY_LABEL[category]}`;

/** Prisma `where` fragment that hides the commission placeholders from artwork lists. */
export const NOT_COMMISSION = { NOT: { slug: { startsWith: COMMISSION_SLUG_PREFIX } } } as const;

const MEDIUM_RE = /^Medium: (.+)$/m;
const PHOTO_RE = /^Reference photo: (https:\/\/\S+)$/m;
const NEEDED_RE = /^Needed by: (\d{4}-\d{2}-\d{2})$/m;

export function buildItemNotes(p: { medium?: string; photoUrl?: string | null }): string {
  return [p.medium && `Medium: ${p.medium}`, p.photoUrl && `Reference photo: ${p.photoUrl}`].filter(Boolean).join("\n");
}

export function buildOrderNotes(p: { neededBy?: string | null; notes?: string | null }): string | undefined {
  const s = [p.neededBy && `Needed by: ${p.neededBy}`, p.notes?.trim()].filter(Boolean).join("\n");
  return s || undefined;
}

/** Reads back what buildItemNotes / buildOrderNotes wrote. */
export function parseCommissionNotes(itemNotes?: string | null, orderNotes?: string | null) {
  return {
    medium: itemNotes?.match(MEDIUM_RE)?.[1],
    photoUrl: itemNotes?.match(PHOTO_RE)?.[1],
    neededBy: orderNotes?.match(NEEDED_RE)?.[1],
  };
}

/** Order notes without the machine-written "Needed by" line (for display). */
export function freeTextNotes(orderNotes?: string | null): string {
  return (orderNotes ?? "").replace(NEEDED_RE, "").trim();
}
