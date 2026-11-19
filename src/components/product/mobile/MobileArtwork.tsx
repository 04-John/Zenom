"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { WallIcon } from "@/components/storefront-mobile/icons";
import {
  DEFAULT_SIZE_INDEX,
  DELIVERY_KADUNA,
  MAX_SUBJECTS,
  PRICE_PER_ADDITIONAL_SUBJECT,
  SIZES,
  WHATSAPP_NUMBER,
  artworkPrice,
  formatNaira,
  framingPrice,
  isPortrait,
  unitPriceFor,
} from "@/lib/pricing";
import type { CustomizerArt } from "../ProductCustomizer";
import { MobileWallSheet } from "./MobileWallSheet";

const EASE = "cubic-bezier(.16,1,.3,1)";
const TOAST_MS = 1900;

// Fits the piece in a 210×250 box at its own aspect ratio (reference art: 196×250).
function artBox(width: number, height: number) {
  const r = width > 0 && height > 0 ? width / height : 0.8;
  let h = 250;
  let w = h * r;
  if (w > 210) {
    w = 210;
    h = w / r;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

// The artwork screen below 900px (reference: Artwork / Prototype "artwork"):
// art stage, then size grid (3×2) → framing segmented control → people
// stepper (portraits). The total bar is pinned to the bottom; the frame and
// mat animate when framing changes. Add to bag pops the bag count, shows a
// toast, and the button becomes "View bag →". "See it on a wall" opens the
// to-scale sheet. Prices come from lib/pricing only.
export function MobileArtwork({ art, kicker }: { art: CustomizerArt; kicker: string }) {
  const portrait = isPortrait(art.category);
  const { addItem, items } = useCart();

  const [sizeIndex, setSizeIndex] = useState(DEFAULT_SIZE_INDEX);
  const [framed, setFramed] = useState(true);
  const [people, setPeople] = useState(1);
  const [added, setAdded] = useState(false);
  const [wallOpen, setWallOpen] = useState(false);
  const [toast, setToast] = useState(0);
  const toastTimer = useRef<number>();

  // Cards and shared links can open the wall straight away with ?wall=1.
  useEffect(() => {
    if (window.innerWidth < 900 && new URLSearchParams(window.location.search).get("wall") === "1") setWallOpen(true);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  const closeWall = useCallback(() => setWallOpen(false), []);

  const subjectCount = portrait ? people : 1;
  const total = unitPriceFor({ category: art.category, sizeIndex, framed, subjectCount }) + DELIVERY_KADUNA;
  const box = artBox(art.width, art.height);

  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setAdded(false);
  };
  const pickSize = change(setSizeIndex);
  const pickFramed = change(setFramed);
  const pickPeople = change(setPeople);

  const addToBag = () => {
    addItem({
      productId: art.id,
      productName: art.name,
      productSlug: art.slug,
      archiveCode: art.code,
      imageUrl: art.imageUrl,
      category: art.category,
      sizeIndex,
      framed,
      subjectCount,
    });
    setAdded(true);
    setToast((t) => t + 1);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(0), TOAST_MS);
  };

  const askUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi Zenom Studio, is "${art.name}" (${art.code}) still available?`
  )}`;

  const ctaClass = (wide: boolean) =>
    `zb zf flex h-[54px] items-center justify-center whitespace-nowrap rounded-pill bg-ember px-[26px] text-[15px] font-semibold text-night transition-colors duration-300 hover:text-night ${
      wide ? "w-full" : ""
    }`;
  const cta = (wide: boolean) =>
    !art.available ? (
      <a href={askUrl} target="_blank" rel="noopener noreferrer" className={ctaClass(wide)}>
        Ask on WhatsApp
      </a>
    ) : added ? (
      <Link href="/cart" className={ctaClass(wide)}>
        View bag <span aria-hidden>&nbsp;→</span>
      </Link>
    ) : (
      <button type="button" onClick={addToBag} className={ctaClass(wide)}>
        Add to bag
      </button>
    );

  const seg = (on: boolean) =>
    `zb zf h-11 rounded-pill text-center text-[14px] font-medium transition-colors duration-300 ${on ? "bg-ink text-night" : "text-ink-2"}`;

  return (
    <div className="flex min-h-[100svh] flex-col">
      {/* Art stage */}
      <div
        className="relative flex h-[min(500px,64svh)] min-h-[420px] flex-none items-center justify-center pt-14"
        style={{ background: "radial-gradient(ellipse at 50% 50%, #2A241F 0%, #16130F 70%)" }}
      >
        <div style={{ animation: `zArt 1s ${EASE} .2s both` }}>
          <div
            style={{
              boxShadow: "0 30px 70px rgba(0,0,0,.5)",
              transition: `all .6s ${EASE}`,
              ...(framed
                ? { border: "12px solid #2B211A", padding: 16, background: "#F2EDE4" }
                : { border: "0px solid #2B211A", padding: 0, background: "transparent" }),
            }}
          >
            <div className="relative" style={{ width: box.w, height: box.h }}>
              <Image src={art.imageUrl} alt={art.name} fill priority sizes="(max-width: 899.98px) 240px, 1px" className="object-cover" />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWallOpen(true)}
          className="zb zf absolute bottom-4 right-4 flex h-11 items-center gap-2 rounded-pill border border-ink/25 bg-[rgba(18,16,14,.6)] px-3.5 text-[12px] font-medium text-ink backdrop-blur-sm"
        >
          <WallIcon />
          See it on a wall
        </button>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-7 px-6 pt-[26px]">
        <div className="zr flex flex-col gap-2" style={{ animationDelay: ".25s" }}>
          <p className="zk text-ink-3">{kicker}</p>
          <h1 className="zs text-[30px] leading-[1.05] text-ink">{art.name}</h1>
          {art.description && <p className="text-[14px] leading-[1.6] text-ink-2">{art.description}</p>}
          {!art.available && <p className="text-[13px] text-ember">Currently unavailable. Ask Samuel on WhatsApp about a similar piece.</p>}
        </div>

        <fieldset className="zr m-0 min-w-0 border-0 p-0" style={{ animationDelay: ".32s" }}>
          <legend className="zk mb-3 p-0 text-ink-3">Size · inches</legend>
          <div className="grid grid-cols-3 gap-2">
            {SIZES.map((s, i) => {
              const on = i === sizeIndex;
              return (
                <button
                  key={s.label}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pickSize(i)}
                  className={`zb zf flex h-[62px] flex-col items-center justify-center gap-0.5 rounded-[14px] border transition-colors duration-300 ${
                    on ? "border-ink bg-ink text-night" : "border-ink/[0.14] text-ink"
                  }`}
                >
                  <span className="text-[15px] font-semibold">{s.label}</span>
                  <span className="text-[11px] opacity-65">{formatNaira(artworkPrice(art.category, i))}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="zr m-0 min-w-0 border-0 p-0" style={{ animationDelay: ".38s" }}>
          <legend className="zk mb-3 p-0 text-ink-3">Framing</legend>
          <div className="grid grid-cols-2 gap-1 rounded-pill bg-night-raised p-1">
            <button type="button" aria-pressed={!framed} onClick={() => pickFramed(false)} className={seg(!framed)}>
              Paper only
            </button>
            <button type="button" aria-pressed={framed} onClick={() => pickFramed(true)} className={seg(framed)}>
              Framed +{formatNaira(framingPrice(sizeIndex, true))}
            </button>
          </div>
        </fieldset>

        {portrait && (
          <div
            className="zr flex items-center justify-between gap-3 border-y border-ink/10 py-3"
            style={{ animationDelay: ".44s" }}
            role="group"
            aria-labelledby="m-people"
          >
            <span className="flex flex-col gap-0.5">
              <span id="m-people" className="text-[15px] font-medium text-ink">
                People in the portrait
              </span>
              <span className="text-[12px] text-ink-3">+{formatNaira(PRICE_PER_ADDITIONAL_SUBJECT)} each extra person</span>
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                aria-label="One less person"
                disabled={people <= 1}
                onClick={() => pickPeople(Math.max(1, people - 1))}
                className="zb zf h-11 w-11 rounded-full border border-ink/[0.16] text-center text-[18px] text-ink disabled:opacity-40"
              >
                −
              </button>
              <span className="zn w-7 text-center text-[24px] text-ink" aria-live="polite">
                {people}
              </span>
              <button
                type="button"
                aria-label="One more person"
                disabled={people >= MAX_SUBJECTS}
                onClick={() => pickPeople(Math.min(MAX_SUBJECTS, people + 1))}
                className="zb zf h-11 w-11 rounded-full border border-ink/[0.16] text-center text-[18px] text-ink disabled:opacity-40"
              >
                +
              </button>
            </span>
          </div>
        )}

        <p className="text-[12px] leading-[1.6] text-ink-3">
          Delivery in Kaduna {formatNaira(DELIVERY_KADUNA)} included. Final price is confirmed on WhatsApp; a 50% non-refundable deposit
          starts the work.
        </p>
      </div>

      <div className="min-h-8 flex-1" />

      {/* Pinned total */}
      <div
        className="sticky bottom-0 z-[3] mt-8 flex items-center justify-between gap-4 border-t border-ink/[0.08] bg-[rgba(18,16,14,.94)] pl-6 pr-4 pt-3.5 backdrop-blur-[10px]"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Total · delivered</span>
          <span className="zn text-[24px] leading-none text-ink">{formatNaira(total)}</span>
        </span>
        {cta(false)}
      </div>

      {/* Toast */}
      {toast > 0 && (
        <div
          key={toast}
          aria-hidden
          className="pointer-events-none fixed left-1/2 z-[890] flex h-10 items-center gap-2 whitespace-nowrap rounded-pill bg-ink px-[18px] text-[13px] font-semibold text-night shadow-[0_12px_40px_rgba(0,0,0,.35)]"
          style={{ top: "calc(64px + env(safe-area-inset-top))", opacity: 0, animation: `zToast ${TOAST_MS}ms ${EASE} both` }}
        >
          <span className="h-2 w-2 rounded-full bg-ember" />
          Added to bag
        </div>
      )}
      <p role="status" className="sr-only">
        {toast > 0 ? `${art.name} added to your bag. ${items.length} in your bag.` : ""}
      </p>

      <MobileWallSheet
        open={wallOpen}
        onClose={closeWall}
        name={art.name}
        imageUrl={art.imageUrl}
        sizeIndex={sizeIndex}
        onSize={pickSize}
        framed={framed}
        priceLine={`${framed ? "Framed" : "Paper only"}, delivered ${formatNaira(total)}`}
        cta={cta(true)}
      />
    </div>
  );
}
