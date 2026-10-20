// Single source of truth for every price and size on the site: UI,
// API, database seed, WhatsApp message and email all import from here.
// Model: CATEGORY TABLE x SIZE + optional FRAMING + DELIVERY + additional
// SUBJECTS (portraits only). All money is in kobo (NGN 1 = 100 kobo).
// Deliberately free of "@/" imports so prisma/seed.ts and the check
// script can import it with plain relative paths.

const naira = (n: number) => n * 100;

export type Category = "portrait" | "geometric" | "minimalistic" | "figurative";
export type DeliveryZone = "kaduna" | "other";

export const CATEGORIES: Category[] = ["portrait", "geometric", "minimalistic", "figurative"];
export const ABSTRACT_CATEGORIES: Category[] = ["geometric", "minimalistic", "figurative"];

export const SIZES = [
  { label: "8×12", widthIn: 8, heightIn: 12, sortOrder: 0 },
  { label: "12×16", widthIn: 12, heightIn: 16, sortOrder: 1 },
  { label: "16×20", widthIn: 16, heightIn: 20, sortOrder: 2 },
  { label: "20×24", widthIn: 20, heightIn: 24, sortOrder: 3 },
  { label: "20×30", widthIn: 20, heightIn: 30, sortOrder: 4 },
  { label: "24×36", widthIn: 24, heightIn: 36, sortOrder: 5 },
] as const;

export const DEFAULT_SIZE_INDEX = 2; // 16×20

export const PORTRAIT_PRICES: readonly number[] = [20_000, 30_000, 40_000, 55_000, 75_000, 90_000].map(naira);
export const ABSTRACT_PRICES: readonly number[] = [25_000, 37_000, 50_000, 66_000, 80_000, 95_000].map(naira);
export const FRAMING_PRICES: readonly number[] = [3_000, 3_000, 5_000, 7_000, 11_000, 14_000].map(naira);

export const DELIVERY_KADUNA = naira(1_500);
export const PRICE_PER_ADDITIONAL_SUBJECT = 1_000_000; // NGN 10,000
export const DEPOSIT_RATE = 0.5;
export const MAX_SUBJECTS = 10;

export const WHATSAPP_NUMBER = "2349048528199";

export function isPortrait(category: Category): boolean {
  return category === "portrait";
}

function assertSizeIndex(sizeIndex: number) {
  if (!Number.isInteger(sizeIndex) || sizeIndex < 0 || sizeIndex >= SIZES.length) {
    throw new RangeError(`Invalid size index: ${sizeIndex}`);
  }
}

export function artworkPrice(category: Category, sizeIndex: number): number {
  assertSizeIndex(sizeIndex);
  return (isPortrait(category) ? PORTRAIT_PRICES : ABSTRACT_PRICES)[sizeIndex];
}

export function framingPrice(sizeIndex: number, framed: boolean): number {
  assertSizeIndex(sizeIndex);
  return framed ? FRAMING_PRICES[sizeIndex] : 0;
}

export function additionalSubjectsPrice(category: Category, subjectCount: number): number {
  if (!isPortrait(category)) return 0;
  return Math.max(0, subjectCount - 1) * PRICE_PER_ADDITIONAL_SUBJECT;
}

export type PricedItem = {
  category: Category;
  sizeIndex: number;
  framed: boolean;
  subjectCount: number;
};

// Per-item price: artwork + framing + extra subjects. Delivery is per
// order, not per item, so it is not included here.
export function unitPriceFor(item: PricedItem): number {
  return (
    artworkPrice(item.category, item.sizeIndex) +
    framingPrice(item.sizeIndex, item.framed) +
    additionalSubjectsPrice(item.category, item.subjectCount)
  );
}

export function deliveryFee(delivery: DeliveryZone): number {
  return delivery === "kaduna" ? DELIVERY_KADUNA : 0;
}

// Outside-Kaduna delivery is quoted on WhatsApp, so it adds nothing here.
export function orderTotals(items: PricedItem[], delivery: DeliveryZone) {
  const subtotal = items.reduce((sum, i) => sum + unitPriceFor(i), 0);
  const fee = items.length > 0 ? deliveryFee(delivery) : 0;
  const total = subtotal + fee;
  const deposit = Math.round(total * DEPOSIT_RATE);
  return { subtotal, delivery: fee, total, deposit };
}

// "₦24,500" from kobo.
export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}

export function sizeLabel(sizeIndex: number): string {
  assertSizeIndex(sizeIndex);
  return SIZES[sizeIndex].label;
}

// Navigation groups geometric/minimalistic/figurative under "Abstract".
export function pillarFor(category: Category): "PORTRAITS" | "ABSTRACT" {
  return isPortrait(category) ? "PORTRAITS" : "ABSTRACT";
}

export const CATEGORY_LABEL: Record<Category, string> = {
  portrait: "Portrait",
  geometric: "Geometric",
  minimalistic: "Minimalistic",
  figurative: "Figurative",
};

// Prisma enum <-> lib category.
export type DbCategory = "PORTRAIT" | "GEOMETRIC" | "MINIMALISTIC" | "FIGURATIVE";
export const toDbCategory = (c: Category): DbCategory => c.toUpperCase() as DbCategory;
export const fromDbCategory = (c: DbCategory): Category => c.toLowerCase() as Category;

// Cheapest sizes, for "from ₦…" labels.
export const startingPrice = (category: Category) => artworkPrice(category, 0);
