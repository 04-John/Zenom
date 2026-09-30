"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

// Checkout is intentionally simple: no payment fields, ever. Order is
// saved to Postgres first; only on success does WhatsApp open — WhatsApp
// is a handoff, never the source of truth. Submit is disabled while
// in-flight to prevent duplicate orders from repeated clicks.
export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    notes: "",
  });

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <EmptyState
          title="Your order bag is empty."
          action={
            <Link href="/portraits" className="text-copper underline">
              Explore Collection
            </Link>
          }
        />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // idempotency guard against double-submit
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({
            productId: i.productId,
            sizeId: i.sizeId,
            backgroundTrackId: i.backgroundTrackId,
            quantity: i.quantity,
            notes: i.notes,
          })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong while submitting your order.");
      }

      const { whatsappUrl, orderNumber } = await res.json();
      clear();

      // Order already exists in the database at this point — WhatsApp
      // opening or not opening has no bearing on whether the order is real.
      if (whatsappUrl) window.open(whatsappUrl, "_blank");
      router.push(`/account/orders?confirmed=${orderNumber}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 lg:px-10">
      <h1 className="font-display text-4xl text-navy">Checkout</h1>
      <p className="mt-2 text-sm text-charcoal/70">
        No payment is required here. After you submit, WhatsApp will open with your order details
        so we can confirm pricing, availability, and delivery.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <Field label="Full name" value={form.customerName} onChange={(v) => setForm({ ...form, customerName: v })} required />
        <Field label="Email" type="email" value={form.customerEmail} onChange={(v) => setForm({ ...form, customerEmail: v })} required />
        <Field label="Phone" value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} required />
        <Field label="Delivery address" value={form.deliveryAddress} onChange={(v) => setForm({ ...form, deliveryAddress: v })} required />
        <Field label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} textarea />

        <div className="flex justify-between border-t border-charcoal/10 pt-6 text-sm text-charcoal/70">
          <span>Estimated subtotal</span>
          <span>₦{(subtotal / 100).toLocaleString()}</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" loading={submitting} className="w-full">
          Submit Order & Continue to WhatsApp
        </Button>
        <p className="text-xs text-charcoal/50">
          By submitting, you agree to our{" "}
          <a href="/terms" className="text-copper underline">Terms of Service</a> and{" "}
          <a href="/privacy" className="text-copper underline">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-navy">
        {label} {required && <span className="text-copper">*</span>}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-btn border border-charcoal/20 p-3 text-sm focus:border-copper focus:outline-none"
        />
      ) : (
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-btn border border-charcoal/20 p-3 text-sm focus:border-copper focus:outline-none"
        />
      )}
    </label>
  );
}
