"use client";

import { useState, type InputHTMLAttributes } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/context/CartContext";
import { CloseIcon, WhatsAppIcon } from "@/components/storefront-mobile/icons";
import { GALLERY_ALL } from "@/components/storefront-mobile/routes";
import { SIZES, formatNaira, isPortrait, type DeliveryZone } from "@/lib/pricing";
import { deliveryLabel } from "./OrderBag";
import { MobileOrderSent } from "./MobileOrderSent";
import { useSendOrder } from "./useSendOrder";

/** "16×20 in · Framed · 1 person" (people only for portraits). */
export function mobileItemSpec(item: Pick<CartItem, "sizeIndex" | "framed" | "subjectCount" | "category">) {
  const people = isPortrait(item.category) ? ` · ${item.subjectCount} ${item.subjectCount > 1 ? "people" : "person"}` : "";
  return `${SIZES[item.sizeIndex].label} in · ${item.framed ? "Framed" : "Paper only"}${people}`;
}

const DELIVERY: [DeliveryZone, string][] = [
  ["kaduna", "Kaduna"],
  ["other", "Outside Kaduna"],
];

// Bag and checkout as one screen below 900px (reference: Bag / Prototype
// "bag"), shown on both /cart and /checkout: the pieces, the delivery toggle,
// the details form and a pinned "Send order on WhatsApp". Sending uses the
// same order hand-off as the desktop checkout (useSendOrder), then the
// "Order sent" screen fades in.
export function MobileBag() {
  const { items, removeItem, totals, delivery, setDelivery, hydrated } = useCart();
  const { submitting, error, sent, send } = useSendOrder();
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", deliveryAddress: "", notes: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  if (sent) return <MobileOrderSent order={sent} />;

  const n = items.length;
  const full = hydrated && n > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send(form);
      }}
      aria-label="Your bag"
      className="flex min-h-[100svh] flex-col"
      style={{ paddingTop: "calc(56px + env(safe-area-inset-top))" }}
    >
      <div className="flex flex-col gap-6 px-6 pt-2">
        <h1 className="zs zr text-[32px] leading-none text-ink">Your bag.</h1>

        {!hydrated && <div className="min-h-[40vh]" aria-hidden />}

        {hydrated && n === 0 && (
          <div className="zr flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-[14px] text-ink-2">Nothing here yet.</p>
            <Link
              href={GALLERY_ALL}
              className="zf flex h-12 items-center rounded-pill border border-ink/20 px-[22px] text-[14px] text-ink hover:border-ink/50 hover:text-ink"
            >
              Explore the work
            </Link>
          </div>
        )}

        {full && (
          <>
            <ul className="flex flex-col gap-5">
              {items.map((item) => (
                <li key={item.id} className="zr flex items-center gap-4" style={{ animationDelay: ".1s" }}>
                  <span className="relative h-[85px] w-[68px] flex-none overflow-hidden rounded-[10px] bg-night-raised">
                    <Image src={item.imageUrl} alt="" fill sizes="68px" className="object-cover" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[15px] font-medium leading-snug text-ink">{item.productName}</span>
                    <span className="text-[12px] text-ink-3">{mobileItemSpec(item)}</span>
                    <span className="zn text-[18px] text-ink">{formatNaira(item.unitPrice)}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.productName}`}
                    onClick={() => removeItem(item.id)}
                    className="zb zf flex h-11 w-11 flex-none items-center justify-center rounded-full text-ink-3 hover:text-ink"
                  >
                    <CloseIcon size={18} />
                  </button>
                </li>
              ))}
            </ul>

            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="zk mb-3 p-0 text-ink-3">Delivery</legend>
              <div className="grid grid-cols-2 gap-1 rounded-pill bg-night-raised p-1">
                {DELIVERY.map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={delivery === k}
                    onClick={() => setDelivery(k)}
                    className={`zb zf h-11 rounded-pill text-center text-[14px] font-medium transition-colors duration-300 ${
                      delivery === k ? "bg-ink text-night" : "text-ink-2"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3">
              <Field
                label="Full name"
                value={form.customerName}
                onChange={set("customerName")}
                placeholder="Your name"
                autoComplete="name"
                minLength={2}
                maxLength={120}
              />
              <Field
                label="WhatsApp number"
                type="tel"
                inputMode="tel"
                value={form.customerPhone}
                onChange={set("customerPhone")}
                placeholder="+234"
                autoComplete="tel"
                minLength={7}
                maxLength={20}
              />
              <Field
                label="Email"
                type="email"
                inputMode="email"
                value={form.customerEmail}
                onChange={set("customerEmail")}
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
              />
              <Field
                label="Delivery address"
                value={form.deliveryAddress}
                onChange={set("deliveryAddress")}
                placeholder="Street, area, city"
                autoComplete="street-address"
                minLength={5}
                maxLength={500}
              />
            </div>

            <dl className="m-0 flex flex-col gap-2.5 text-[14px]">
              <div className="flex justify-between text-ink-2">
                <dt>Artwork{n > 1 ? "s" : ""}</dt>
                <dd className="m-0">{formatNaira(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-2">
                <dt>Delivery</dt>
                <dd className="m-0">{deliveryLabel(delivery, totals.delivery)}</dd>
              </div>
              <div className="flex justify-between text-ember">
                <dt>50% deposit to begin</dt>
                <dd className="m-0">{formatNaira(totals.deposit)}</dd>
              </div>
            </dl>

            <p className="text-[12px] leading-[1.6] text-ink-3">
              Your order opens in WhatsApp with every detail filled in; Samuel confirms the price, timeline and deposit there. By
              sending, you agree to our{" "}
              <Link href="/terms" className="text-ink-2 underline hover:text-ink">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-ink-2 underline hover:text-ink">
                Privacy Policy
              </Link>
              .
            </p>
          </>
        )}
      </div>

      <div className="min-h-8 flex-1" />

      {full && (
        <div
          className="sticky bottom-0 z-[3] mt-8 flex flex-col gap-3 border-t border-ink/[0.08] bg-[rgba(18,16,14,.94)] px-6 pt-3.5 backdrop-blur-[10px]"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
        >
          {error && (
            <p role="alert" className="text-[13px] leading-[1.5] text-ember">
              {error}
            </p>
          )}
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Total</span>
            <span className="zn text-[24px] leading-none text-ink">
              {formatNaira(totals.total)}
              {delivery === "other" && (
                <>
                  <span aria-hidden> +</span>
                  <span className="sr-only"> plus delivery, quoted on WhatsApp</span>
                </>
              )}
            </span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting || undefined}
            className="zb zf flex h-[54px] items-center justify-center gap-2.5 rounded-pill bg-ember text-[15px] font-semibold text-night transition-opacity disabled:opacity-70"
          >
            <WhatsAppIcon />
            {submitting ? "Sending…" : "Send order on WhatsApp"}
          </button>
        </div>
      )}
    </form>
  );
}

function Field({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">{label}</span>
      <input
        required
        {...input}
        className="h-[50px] w-full rounded-input border border-ink/[0.12] bg-night-raised px-4 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-ember focus-visible:border-ember"
      />
    </label>
  );
}
