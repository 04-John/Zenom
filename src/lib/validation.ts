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
