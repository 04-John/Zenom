"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ZenomLockup } from "@/components/brand/ZenomLockup";
import { PageIntro } from "@/components/motion/PageIntro";
import { Reveal } from "@/components/motion/Reveal";
import { Button, buttonClass } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { DeliveryToggle, deliveryLabel, itemSpec } from "@/components/cart/OrderBag";
import { art } from "@/lib/catalog";
import { formatNaira } from "@/lib/pricing";

const FALLBACK_FAN = ["w05", "w07", "w01"].map(art);

type Sent = { orderNumber: string; whatsappUrl: string | null };

// Checkout takes no payment. The order is saved first (the server recomputes
// every price); WhatsApp is only the hand-off afterwards. Submit is guarded
// while in flight so repeated clicks cannot create duplicate orders.
export default function CheckoutPage() {
  const { items, totals, delivery, setDelivery, clear, hydrated } = useCart();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", deliveryAddress: "", notes: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    // Popup blockers only allow window.open during the click itself, so grab
    // a blank tab now and point it at WhatsApp once the order is saved.
    const tab = window.open("", "_blank");

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

      const { whatsappUrl, orderNumber } = (await res.json()) as { whatsappUrl?: string; orderNumber: string };
      let opened = false;
      if (whatsappUrl && tab && !tab.closed) {
        tab.location.href = whatsappUrl;
        opened = true;
      } else if (tab) {
        tab.close();
      }
      setSent({ orderNumber, whatsappUrl: opened ? null : whatsappUrl ?? null });
      clear();
      window.scrollTo({ top: 0 });
    } catch (err) {
      tab?.close();
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  const n = items.length;
  const fan = n ? items.slice(0, 5).map((i) => i.imageUrl) : FALLBACK_FAN;

  return (
    <>
      <PageIntro
        kicker={sent ? `ORDER ${sent.orderNumber}` : "CHECKOUT"}
        title={sent ? "Sent." : "Almost yours."}
        blurb={sent ? "The conversation continues on WhatsApp." : "A few details, then your order opens in WhatsApp."}
        bg="#ECE5D8"
        ink="#1A1714"
        images={fan}
      />

      <div className="relative z-[2] mx-auto max-w-[1180px] px-4 pb-36 pt-10 min-[900px]:px-6">
        {sent ? (
          <div className="py-14 text-center">
            <Reveal variant="pop" className="mx-auto flex justify-center">
              <ZenomLockup variant="stacked" size={0.9} animate />
            </Reveal>
            <Reveal variant="up" className="kicker mt-7">
              ORDER {sent.orderNumber} SENT
            </Reveal>
            <Reveal as="h2" variant="mask" className="mt-4 font-display text-[clamp(52px,7vw,104px)] italic leading-[0.9]">
              Thank you.
            </Reveal>
            <Reveal variant="up" className="mx-auto mb-8 mt-5 max-w-[420px] leading-[1.7] text-ink-2">
              Samuel will reply on WhatsApp to confirm details and the 50% deposit.
            </Reveal>
            <div className="flex flex-wrap justify-center gap-3">
              {sent.whatsappUrl && (
                <a href={sent.whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("ember")}>
                  Open WhatsApp
                </a>
              )}
              <Link href="/account" className={buttonClass("primary")}>
                View my orders
              </Link>
            </div>
          </div>
        ) : hydrated && n === 0 ? (
          <Reveal variant="up" className="rounded-card border border-dashed border-ink/20 px-6 py-16 text-center">
            <p className="mb-5 text-ink-2">Your bag is empty.</p>
            <Link href="/abstract" className={buttonClass("primary")}>
              Browse the work
            </Link>
          </Reveal>
        ) : !hydrated ? (
          <div className="min-h-[40vh]" aria-hidden />
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-10">
            <div className="flex flex-col gap-3.5">
              <Field label="FULL NAME" value={form.customerName} onChange={set("customerName")} placeholder="Your name" autoComplete="name" minLength={2} maxLength={120} />
              <Field label="WHATSAPP NUMBER" type="tel" value={form.customerPhone} onChange={set("customerPhone")} placeholder="+234…" autoComplete="tel" minLength={7} maxLength={20} />
              <Field label="EMAIL" type="email" value={form.customerEmail} onChange={set("customerEmail")} placeholder="you@example.com" autoComplete="email" />
              <Field label="DELIVERY ADDRESS" value={form.deliveryAddress} onChange={set("deliveryAddress")} placeholder="Street, area, city" autoComplete="street-address" minLength={5} maxLength={500} />
              <Field label="NOTES (OPTIONAL)" value={form.notes} onChange={set("notes")} placeholder="Anything Samuel should know" maxLength={1000} textarea optional />
            </div>

            <Reveal variant="up" className="rounded-card bg-night-raised p-6">
              <div className="label-mono mb-3.5">
                {n} piece{n > 1 ? "s" : ""}
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2">
                  <div className="relative h-[54px] w-11 shrink-0 overflow-hidden rounded-lg bg-night-hover">
                    <Image src={item.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 text-[13px]">
                    <div className="font-semibold">{item.productName}</div>
                    <div className="text-ink-3">{itemSpec(item)}</div>
                  </div>
                  <div className="text-sm">{formatNaira(item.unitPrice)}</div>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-ink/10 pb-1 pt-3 text-sm text-ink-2">
                <span>Delivery</span>
                <span className="text-ink">{deliveryLabel(delivery, totals.delivery)}</span>
              </div>
              <DeliveryToggle value={delivery} onChange={setDelivery} className="my-2" />
              <div className="flex items-baseline justify-between py-1.5">
                <span>Total</span>
                <span className="font-display text-4xl not-italic">{formatNaira(totals.total)}</span>
              </div>
              <div className="flex justify-between pb-[18px] text-[13px] text-ember">
                <span>50% deposit to begin</span>
                <span>{formatNaira(totals.deposit)}</span>
              </div>

              {error && (
                <p role="alert" className="mb-3 text-sm text-ember">
                  {error}
                </p>
              )}
              <button type="submit" disabled={submitting} className={buttonClass("ember", "w-full py-4 text-[15px]")}>
                {submitting ? "Sending…" : "Send order on WhatsApp"}
              </button>
              <p className="mt-3.5 text-xs leading-[1.6] text-ink-3">
                Your order opens in WhatsApp with every detail filled in. We confirm pricing, timeline and the deposit there.
              </p>
              <p className="mt-2 text-xs leading-[1.6] text-ink-3">
                By sending, you agree to our{" "}
                <Link href="/terms" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </Reveal>
          </form>
        )}
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea,
  optional,
  minLength,
  maxLength,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  optional?: boolean;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}) {
  const common = {
    value,
    placeholder,
    required: !optional,
    minLength,
    maxLength,
    autoComplete,
    className: "field",
  };
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">{label}</span>
      {textarea ? (
        <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
