"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Trash2 } from "lucide-react";

// Deliberately NOT a fake payment-cart. Because pricing is confirmed
// manually on WhatsApp, that's stated plainly rather than implied by a
// "Pay Now" button that doesn't exist.
export function OrderBag() {
  const { items, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your order bag is waiting for something beautiful."
        action={
          <Link href="/portraits">
            <Button variant="secondary">Explore Collection</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <ul className="space-y-6">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 border-b border-charcoal/10 pb-6">
            <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-btn bg-navy/5">
              <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <p className="font-display text-lg text-navy">{item.productName}</p>
              <p className="text-sm text-charcoal/60">
                {item.sizeLabel} · {item.backgroundTrackLabel}
              </p>
              {item.notes && <p className="mt-1 text-xs text-charcoal/50">&ldquo;{item.notes}&rdquo;</p>}
            </div>
            <div className="flex flex-col items-end justify-between">
              <button
                onClick={() => removeItem(item.id)}
                aria-label="Remove item"
                className="text-charcoal/40 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Trash2 size={18} />
              </button>
              <p className="text-sm font-medium text-navy">
                ₦{((item.unitPrice * item.quantity) / 100).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-1">
        <div className="flex justify-between text-sm text-charcoal/70">
          <span>Estimated subtotal</span>
          <span>₦{(subtotal / 100).toLocaleString()}</span>
        </div>
        <p className="text-xs text-charcoal/50">
          Final pricing will be confirmed with you on WhatsApp.
        </p>
      </div>

      <Link href="/checkout">
        <Button className="w-full">Continue to Checkout</Button>
      </Link>
    </div>
  );
}
