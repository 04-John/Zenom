// Commission requests (the light app's 4-step "Start a commission" flow).
//
// A commission is not tied to an artwork in the catalogue: the customer picks
// a room (category), a medium, a size and sends a photo. To keep the schema
// unchanged (no migration on the live database), each request is saved as an
// ordinary Order with one OrderItem that points at a hidden, per-category
// "commission" Product (status DRAFT, slug "commission-<category>", created on
// first use by /api/orders). The product ties the request to its room, so
// everything that reads orders (studio stats, emails, order pages) keeps
// working and category revenue stays correct. The medium and reference photo
// are OrderItem columns (medium, referencePhotoUrl); the "needed by" date is
// Order.neededBy. This module is client-safe.

import type { Medium as DbMedium } from "@prisma/client";
import { CATEGORY_LABEL, type Category } from "@/lib/pricing";

export const COMMISSION_SLUG_PREFIX = "commission-";

export const MEDIUMS = ["Charcoal", "Graphite", "Colour pencil"] as const;
export type Medium = (typeof MEDIUMS)[number];
export type { DbMedium };

export const MEDIUM_TO_DB: Record<Medium, DbMedium> = {
  Charcoal: "CHARCOAL",
  Graphite: "GRAPHITE",
  "Colour pencil": "COLOUR_PENCIL",
};
const MEDIUM_FROM_DB: Record<DbMedium, Medium> = { CHARCOAL: "Charcoal", GRAPHITE: "Graphite", COLOUR_PENCIL: "Colour pencil" };

/** "Charcoal" from OrderItem.medium (undefined for artwork orders). */
export const mediumLabel = (m: DbMedium | null | undefined): Medium | undefined => (m ? MEDIUM_FROM_DB[m] : undefined);

/** "2026-12-24" from Order.neededBy (a date-only column, read back as UTC midnight). */
export const isoDay = (d: Date | null | undefined): string | undefined => (d ? d.toISOString().slice(0, 10) : undefined);

export const commissionSlug = (category: Category) => `${COMMISSION_SLUG_PREFIX}${category}`;
export const isCommissionSlug = (slug: string | null | undefined) => !!slug?.startsWith(COMMISSION_SLUG_PREFIX);
export const commissionProductName = (category: Category) => `Commission · ${CATEGORY_LABEL[category]}`;

/** Prisma `where` fragment that hides the commission placeholders from artwork lists. */
export const NOT_COMMISSION = { NOT: { slug: { startsWith: COMMISSION_SLUG_PREFIX } } } as const;
