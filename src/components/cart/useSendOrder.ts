"use client";

import { useRef, useState } from "react";
import { useCart, type CartItem } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import type { DeliveryZone } from "@/lib/pricing";

export type OrderForm = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  notes: string;
};

export type SentOrder = {
  id: string | null;
  orderNumber: string;
  /** Set only when the WhatsApp tab could not be opened automatically. */
  whatsappUrl: string | null;
  /** Server-computed amounts, in kobo. */
  total: number | null;
  deposit: number | null;
  /** What was in the bag when it was sent (the bag is cleared afterwards). */
  items: CartItem[];
  delivery: DeliveryZone;
};

// The order hand-off shared by the desktop checkout and the mobile bag.
// Checkout takes no payment. The order is saved first (the server recomputes
// every price); WhatsApp is only the hand-off afterwards. Submit is guarded
// while in flight so repeated taps cannot create duplicate orders.
export function useSendOrder() {
  const { items, delivery, clear } = useCart();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<SentOrder | null>(null);
  const inFlight = useRef(false);

  async function send(form: OrderForm) {
    if (submitting || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);

    // Popup blockers only allow window.open during the click itself, so grab
    // a blank tab now and point it at WhatsApp once the order is saved.
    const tab = window.open("", "_blank");
    const snapshot = items;
    const zone = delivery;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim(),
          customerPhone: form.customerPhone.trim(),
          deliveryAddress: form.deliveryAddress.trim(),
          delivery,
          notes: form.notes.trim() || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            sizeIndex: i.sizeIndex,
            framed: i.framed,
            subjectCount: i.subjectCount,
            notes: i.notes || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong while submitting your order.");
      }

      const body = (await res.json()) as {
        id?: string;
        whatsappUrl?: string;
        orderNumber: string;
        total?: number;
        deposit?: number;
      };
      let opened = false;
      if (body.whatsappUrl && tab && !tab.closed) {
        tab.location.href = body.whatsappUrl;
        opened = true;
      } else if (tab) {
        tab.close();
      }
      setSent({
        id: body.id ?? null,
        orderNumber: body.orderNumber,
        whatsappUrl: opened ? null : body.whatsappUrl ?? null,
        total: typeof body.total === "number" ? body.total : null,
        deposit: typeof body.deposit === "number" ? body.deposit : null,
        items: snapshot,
        delivery: zone,
      });
      clear();
      window.scrollTo({ top: 0 });
    } catch (err) {
      tab?.close();
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      toast(message, "error");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return { submitting, error, sent, send };
}
