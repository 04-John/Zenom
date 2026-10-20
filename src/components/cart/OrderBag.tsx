"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/context/CartContext";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { PageIntro } from "@/components/motion/PageIntro";
import { Reveal } from "@/components/motion/Reveal";
import { buttonClass } from "@/components/ui/Button";
import { art } from "@/lib/catalog";
import { SIZES, formatNaira, type DeliveryZone } from "@/lib/pricing";
import { cn } from "@/lib/cn";

const FALLBACK_FAN = ["w05", "g02", "m03"].map(art);

export function itemSpec(item: CartItem) {
  return `${SIZES[item.sizeIndex].label} in · ${item.framed ? "Framed" : "Unframed"}${
    item.subjectCount > 1 ? ` · ${item.subjectCount} subjects` : ""
  }`;
}

// Shared by the bag and checkout summaries.
export function DeliveryToggle({
  value,
  onChange,
  className,
}: {
  value: DeliveryZone;
  onChange: (d: DeliveryZone) => void;
  className?: string;
}) {
  const opts: [DeliveryZone, string][] = [
    ["kaduna", "Kaduna"],
    ["other", "Outside Kaduna"],
  ];
  return (
    <div className={cn("flex gap-1.5", className)} role="group" aria-label="Delivery area">
      {opts.map(([k, label]) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => onChange(k)}
          className={cn(
            "flex-1 rounded-pill border px-2.5 py-2.5 text-xs transition-colors",
            value === k ? "border-ink bg-ink text-night" : "border-ink/15 text-ink hover:border-ink/40"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function deliveryLabel(zone: DeliveryZone, fee: number) {
  return zone === "kaduna" ? formatNaira(fee) : "Quoted on WhatsApp";
}

export function OrderBag() {
  const { items, removeItem, totals, delivery, setDelivery, hydrated } = useCart();
  const n = items.length;
  const empty = hydrated && n === 0;

  const fan = n ? items.slice(0, 5).map((i) => i.imageUrl) : FALLBACK_FAN;

  return (
    <>
      <PageIntro
        kicker="YOUR ORDER BAG"
        title={empty ? "Your bag is empty." : "Your bag."}
        blurb={n ? `${n} piece${n > 1 ? "s" : ""}, waiting to be drawn.` : "Pieces you add will wait here."}
        bg="#ECE5D8"
        ink="#1A1714"
        images={fan}
      />

      <div className="relative z-[2] mx-auto max-w-[1180px] px-4 pb-36 pt-10 min-[900px]:px-6">
        {!hydrated && <div className="min-h-[40vh]" aria-hidden />}

        {empty && (
          <Reveal variant="up" className="rounded-card border border-dashed border-ink/20 px-6 py-16 text-center">
            <span aria-hidden className="mb-5 flex justify-center">
              <ZenomMark size={56} title="" />
            </span>
            <p className="mb-5 text-ink-2">Nothing here yet.</p>
            <Link href="/abstract" className={buttonClass("primary")}>
              Browse the work
            </Link>
          </Reveal>
        )}

        {hydrated && n > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-start gap-10">
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <Reveal key={item.id} as="li" variant="up" className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-[18px] rounded-[20px] bg-night-raised p-3">
                  <div className="relative h-[110px] w-[88px] overflow-hidden rounded-xl bg-night-hover">
                    <Image src={item.imageUrl} alt="" fill sizes="88px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-[28px] italic leading-none">{item.productName}</div>
                    <div className="mt-2 text-[13px] text-ink-2">{itemSpec(item)}</div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.productName}`}
                      className="mt-2.5 font-mono text-[10px] tracking-[0.18em] text-ink-3 transition-colors hover:text-ember"
                    >
                      REMOVE
                    </button>
                  </div>
                  <div className="pr-2 text-base font-semibold">{formatNaira(item.unitPrice)}</div>
                </Reveal>
              ))}
            </ul>

            <Reveal variant="up" className="rounded-card bg-night-raised p-6 min-[900px]:sticky min-[900px]:top-[100px]">
              <div className="label-mono mb-3">Summary</div>
              <Row label="Artwork & framing" value={formatNaira(totals.subtotal)} />
              <Row label="Delivery" value={deliveryLabel(delivery, totals.delivery)} />
              <DeliveryToggle value={delivery} onChange={setDelivery} className="mb-2.5 mt-1.5" />
              <div className="mt-1.5 flex items-baseline justify-between border-t border-ink/10 pt-3.5">
                <span>Total</span>
                <span className="font-display text-[38px] not-italic">{formatNaira(totals.total)}</span>
              </div>
              <div className="flex justify-between pb-[18px] pt-1 text-[13px] text-ember">
                <span>50% deposit to begin</span>
                <span>{formatNaira(totals.deposit)}</span>
              </div>
              <Link href="/checkout" className={buttonClass("primary", "w-full py-[15px] text-[15px]")}>
                Checkout
              </Link>
            </Reveal>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 text-sm text-ink-2">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
