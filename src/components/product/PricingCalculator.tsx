"use client";

import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { buttonClass } from "@/components/ui/Button";
import { art } from "@/lib/catalog";
import {
  DELIVERY_KADUNA,
  SIZES,
  artworkPrice,
  formatNaira,
  framingPrice,
  PRICE_PER_ADDITIONAL_SUBJECT,
  type Category,
} from "@/lib/pricing";

type Table = {
  name: string;
  applies: string;
  // Abstract styles share one price table, so "geometric" stands in for all.
  category: Category;
  img: string;
  cta: string;
  href: string;
};

const TABLES: Table[] = [
  {
    name: "Abstract Art",
    applies: "Geometric, minimalistic and figurative",
    category: "geometric",
    img: art("g07"),
    cta: "Browse Abstract",
    href: "/abstract",
  },
  {
    name: "Portrait Art",
    applies: "Charcoal and pencil, from your photo",
    category: "portrait",
    img: art("w02"),
    cta: "Browse Portraits",
    href: "/portraits",
  },
];

const ROW = "grid grid-cols-[1fr_1fr_1fr_1fr_1.1fr] gap-2";

// Price list: every figure derives from @/lib/pricing, so the table can never
// drift from what the cart and the server charge.
export function PricingCalculator() {
  return (
    <div className="relative z-[2] mx-auto max-w-[1280px] px-4 pb-32 pt-10 min-[900px]:px-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,500px),1fr))] gap-6">
        {TABLES.map((t) => (
          <Reveal key={t.name} variant="toss" className="rounded-[28px] border border-ink/[0.08] bg-night-raised p-5 min-[900px]:p-7">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <div className="label-mono">Zenom Studio</div>
                <div className="mt-1.5 font-display text-[44px] italic leading-none">{t.name}</div>
                <div className="mt-1.5 text-xs text-ink-3">{t.applies}</div>
              </div>
              <Image src={t.img} alt="" width={64} height={80} sizes="64px" className="h-20 w-16 rounded-[10px] object-cover" />
            </div>

            <div className={`${ROW} border-b border-ink/10 py-2.5 font-mono text-[9px] tracking-[0.1em] text-ink-3 min-[900px]:text-[9.5px] min-[900px]:tracking-[0.14em]`}>
              <span>SIZE</span>
              <span>ARTWORK</span>
              <span>FRAMING</span>
              <span>DELIVERY</span>
              <span className="text-right">TOTAL</span>
            </div>
            {SIZES.map((size, i) => {
              const artwork = artworkPrice(t.category, i);
              const frame = framingPrice(i, true);
              return (
                <Reveal key={size.label} variant="up" className={`${ROW} items-baseline border-b border-ink/[0.06] py-3.5 text-[12px] min-[900px]:text-sm`}>
                  <span className="font-display text-[19px] min-[900px]:text-[22px]">{size.label}</span>
                  <span className="text-ink-2">{formatNaira(artwork)}</span>
                  <span className="text-ink-2">{formatNaira(frame)}</span>
                  <span className="text-ink-2">{formatNaira(DELIVERY_KADUNA)}</span>
                  <span className="text-right font-semibold">{formatNaira(artwork + frame + DELIVERY_KADUNA)}</span>
                </Reveal>
              );
            })}

            <Link href={t.href} className={buttonClass("primary", "mt-5")}>
              {t.cta}
            </Link>
          </Reveal>
        ))}
      </div>

      <div className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 text-sm leading-[1.65] text-ink-2">
        <Note title="Additional subjects" body={`Portraits with more than one person add ${formatNaira(PRICE_PER_ADDITIONAL_SUBJECT)} per additional subject.`} />
        <Note title="Deposit" body="A 50% non-refundable deposit is required before production begins." />
        <Note title="Outside Kaduna" body="Delivery is quoted on WhatsApp once your address is confirmed." />
      </div>
    </div>
  );
}

function Note({ title, body }: { title: string; body: string }) {
  return (
    <Reveal variant="up" className="border-t border-ink/[0.12] pt-4">
      <div className="mb-1.5 font-semibold text-ink">{title}</div>
      {body}
    </Reveal>
  );
}
