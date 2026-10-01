import { z } from "zod";

// Every API boundary validates with Zod — never trust client input,
// especially prices, quantities and IDs.
export const checkoutSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(20),
  deliveryAddress: z.string().min(5).max(500),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        sizeId: z.string().cuid().optional(),
        backgroundTrackId: z.string().cuid().optional(),
        quantity: z.number().int().min(1).max(20),
        notes: z.string().max(500).optional(),
      })
    )
    .min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Admin product create/update — categoryId is resolved server-side from
// `pillar` (see /api/products), never accepted from the client.
export const productSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated."),
  description: z.string().min(1).max(5000),
  basePrice: z.number().int().min(0),
  pillar: z.enum(["PORTRAITS", "ABSTRACT", "SPACES"]),
  status: z.enum(["AVAILABLE", "SOLD_OUT", "DRAFT", "COMING_SOON"]),
  archiveCode: z.string().max(50).optional().nullable(),
  abstractStyle: z.enum(["MINIMALIST", "FIGURATIVE", "GEOMETRIC_ABSTRACT"]).optional().nullable(),
  // Not a Product column — pulled out separately to create/update the
  // primary ProductImage. See /api/products and /api/products/[id].
  imageUrl: z.string().url().optional(),
});

export const productUpdateSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
