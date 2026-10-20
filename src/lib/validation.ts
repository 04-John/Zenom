import { z } from "zod";
import { SIZES, MAX_SUBJECTS } from "@/lib/pricing";

// Every API boundary validates with Zod — never trust client input.
// Prices are NOT accepted from the client at all: the server recomputes
// every amount from src/lib/pricing.ts (zod strips unknown keys).
export const checkoutSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(20),
  deliveryAddress: z.string().min(5).max(500),
  delivery: z.enum(["kaduna", "other"]),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        sizeIndex: z.number().int().min(0).max(SIZES.length - 1),
        framed: z.boolean(),
        // Must be 1 for non-portraits; checked against the product's
        // category in /api/orders (the category lives in the database).
        subjectCount: z.number().int().min(1).max(MAX_SUBJECTS).default(1),
        notes: z.string().max(1000).optional(),
      })
    )
    .min(1)
    .max(20),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Admin product create/update — `pillar` is derived from `category` on the
// server, never accepted from the client.
export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated."),
  description: z.string().min(1).max(5000),
  category: z.enum(["PORTRAIT", "GEOMETRIC", "MINIMALISTIC", "FIGURATIVE"]),
  status: z.enum(["AVAILABLE", "SOLD_OUT", "DRAFT", "COMING_SOON"]),
  archiveCode: z.string().max(50).optional().nullable(),
  // Not a Product column — pulled out separately to create/update the
  // primary ProductImage. See /api/products and /api/products/[id].
  imageUrl: z.string().min(1).max(2000).optional(),
});

export const productUpdateSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
