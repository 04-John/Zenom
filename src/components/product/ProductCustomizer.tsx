"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/Toast";
import { Reveal } from "@/components/motion/Reveal";
import { triggerAddToBagFly } from "@/components/cart/AddToBagFly";
import { WallPreview } from "./WallPreview";
import {
  DEFAULT_SIZE_INDEX,
  DELIVERY_KADUNA,
  MAX_SUBJECTS,
  PRICE_PER_ADDITIONAL_SUBJECT,
  SIZES,
  WHATSAPP_NUMBER,
  additionalSubjectsPrice,
  artworkPrice,
  formatNaira,
  framingPrice,
  isPortrait,
  unitPriceFor,
  type Category,
} from "@/lib/pricing";

export type CustomizerArt = {
  id: string;
  slug: string;
  name: string;
  code: string;
  description: string;
  category: Category;
  imageUrl: string;
  width: number;
  height: number;
  available: boolean;
};

const label = "mb-3.5 font-mono text-[11px] tracking-[0.2em] text-ink";
const optionClass = (on: boolean) =>
  `rounded-tile border text-left transition-colors ${
    on ? "border-ink bg-ink text-night" : "border-ink/[0.16] text-ink hover:border-ink/50"
  }`;

// The artwork picker: sticky art stage (framed = 14px #2B211A border + 18px
// mat) beside the steps (size, framing, subjects for portraits, notes), the
// live price breakdown, the floating price pill and the wall preview. All
// prices come from @/lib/pricing.
export function ProductCustomizer({ art, categoryLabel }: { art: CustomizerArt; categoryLabel: string }) {
  const portrait = isPortrait(art.category);
  const { addItem } = useCart();
  const { toast } = useToast();

  const [sizeIndex, setSizeIndex] = useState(DEFAULT_SIZE_INDEX);
  const [framed, setFramed] = useState(true);
  const [subjects, setSubjects] = useState(1);
  const [notes, setNotes] = useState("");
  const [wallOpen, setWallOpen] = useState(false);
  const discRef = useRef<HTMLDivElement>(null);

  // Cards link here with ?wall=1 to open the wall preview straight away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("wall") === "1") setWallOpen(true);
  }, []);
  const closeWall = useCallback(() => setWallOpen(false), []);

  const size = SIZES[sizeIndex];
  const subjectCount = portrait ? subjects : 1;
  const unit = unitPriceFor({ category: art.category, sizeIndex, framed, subjectCount });
  const total = unit + DELIVERY_KADUNA;
  const extra = additionalSubjectsPrice(art.category, subjectCount);

  const breakdown: [string, string][] = [
    [`Artwork, ${size.label} in`, formatNaira(artworkPrice(art.category, sizeIndex))],
    ["Framing", framed ? formatNaira(framingPrice(sizeIndex, true)) : "—"],
  ];
  if (portrait && subjectCount > 1) {
    breakdown.push([`${subjectCount - 1} additional subject${subjectCount > 2 ? "s" : ""}`, formatNaira(extra)]);
  }
  breakdown.push(["Delivery (Kaduna)", formatNaira(DELIVERY_KADUNA)]);

  const spec = `${size.label} in · ${framed ? "Framed" : "Unframed"}${portrait && subjects > 1 ? ` · ${subjects} subjects` : ""}`;

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
      notes: notes.trim() || undefined,
    });
    if (discRef.current) triggerAddToBagFly(discRef.current, art.imageUrl);
    toast(`Added ${art.name} to your bag`);
  };

  const askUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi Zenom Studio, is "${art.name}" (${art.code}) still available?`
  )}`;

  const frameStyle: React.CSSProperties = framed
    ? { border: "14px solid #2B211A", outline: "1px solid #4A3A2C", padding: 18, background: "#F2EDE4" }
    : { border: "0px solid #2B211A", outline: "1px solid transparent", padding: 0, background: "transparent", borderRadius: 2 };

  return (
    <>
      <div
        className="grid items-start gap-14"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))" }}
      >
        <Reveal
          variant="blur"
          className="sticky top-[100px] flex items-center justify-center rounded-[28px] p-[clamp(28px,5vw,64px)]"
          style={{
            minHeight: "min(78vh,760px)",
            background: "radial-gradient(ellipse at 50% 20%,#2A241F 0%,#16130F 70%)",
          }}
        >
          <Image
            src={art.imageUrl}
            alt={art.name}
            width={art.width}
            height={art.height}
            sizes="(max-width: 900px) 90vw, 45vw"
            className="block h-auto object-contain shadow-[0_40px_90px_rgba(0,0,0,0.7)] transition-[border,padding,outline] duration-[600ms] ease-[cubic-bezier(.2,.7,.2,1)]"
            style={{ width: `min(100%, calc(66vh * ${art.width / art.height}))`, ...frameStyle }}
          />
        </Reveal>

        <div>
          <Reveal className="font-mono text-[11px] uppercase tracking-[0.28em] text-ember">
            {categoryLabel} · {art.code}
          </Reveal>
          <Reveal
            as="h1"
            variant="mask"
            className="m-0 mt-3.5 font-display font-normal italic"
            style={{ fontSize: "clamp(52px,6vw,92px)", lineHeight: 0.92 }}
          >
            {art.name}
          </Reveal>
          <Reveal as="p" className="m-0 mt-[18px] max-w-[460px] text-[15px] leading-[1.7] text-ink-2">
            {art.description}
          </Reveal>

          <Reveal className="mt-11">
            <div className={label}>01 — SIZE (INCHES)</div>
            <div className="grid grid-cols-3 gap-2">
              {SIZES.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => setSizeIndex(i)}
                  aria-pressed={i === sizeIndex}
                  className={`${optionClass(i === sizeIndex)} flex min-h-[64px] flex-col gap-1 p-2.5`}
                >
                  <span className="font-display text-[24px] leading-none">{s.label}</span>
                  <span className="text-[12px] opacity-70">{formatNaira(artworkPrice(art.category, i))}</span>
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal className="mt-8">
            <div className={label}>02 — FRAMING</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: false, name: "Unframed", sub: "Paper only" },
                { v: true, name: "Framed", sub: `+${formatNaira(framingPrice(sizeIndex, true))}` },
              ].map((o) => (
                <button
                  key={o.name}
                  onClick={() => setFramed(o.v)}
                  aria-pressed={framed === o.v}
                  className={`${optionClass(framed === o.v)} flex min-h-[64px] flex-col gap-1 px-3.5 py-3`}
                >
                  <span className="text-[15px] font-semibold">{o.name}</span>
                  <span className="text-[12px] opacity-70">{o.sub}</span>
                </button>
              ))}
            </div>
          </Reveal>

          {portrait && (
            <Reveal className="mt-8">
              <div className={label}>03 — SUBJECTS ON THIS PIECE</div>
              <div className="flex flex-wrap items-center gap-3.5">
                <button
                  onClick={() => setSubjects((n) => Math.max(1, n - 1))}
                  disabled={subjects <= 1}
                  aria-label="Fewer subjects"
                  className="h-11 w-11 rounded-full border border-ink/20 text-[18px] text-ink transition-colors hover:border-ink disabled:opacity-40"
                >
                  −
                </button>
                <span className="min-w-6 text-center font-display text-[30px]" aria-live="polite">
                  {subjects}
                </span>
                <button
                  onClick={() => setSubjects((n) => Math.min(MAX_SUBJECTS, n + 1))}
                  disabled={subjects >= MAX_SUBJECTS}
                  aria-label="More subjects"
                  className="h-11 w-11 rounded-full border border-ink/20 text-[18px] text-ink transition-colors hover:border-ink disabled:opacity-40"
                >
                  +
                </button>
                <span className="text-[12px] text-ink-3">
                  {subjects > 1
                    ? `+${formatNaira(extra)} for ${subjects - 1} additional`
                    : `+${formatNaira(PRICE_PER_ADDITIONAL_SUBJECT)} per additional subject`}
                </span>
              </div>
            </Reveal>
          )}

          <Reveal className="mt-8">
            <label htmlFor="art-notes" className={`${label} block`}>
              {portrait ? "04" : "03"} — NOTES (OPTIONAL)
            </label>
            <textarea
              id="art-notes"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us anything you'd like us to know about your piece…"
              className="field w-full resize-y"
              style={{ borderRadius: 16 }}
            />
          </Reveal>

          <Reveal className="mt-8 rounded-[20px] bg-night-raised px-[22px] py-5">
            {breakdown.map(([k, v]) => (
              <div key={k} className="flex justify-between py-[7px] text-[14px] text-ink-2">
                <span>{k}</span>
                <span className="text-ink">{v}</span>
              </div>
            ))}
            <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-3.5">
              <span className="text-[14px]">Total, delivered in Kaduna</span>
              <span className="font-display text-[36px]">{formatNaira(total)}</span>
            </div>
          </Reveal>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {art.available ? (
              <button
                onClick={addToBag}
                className="min-w-[180px] flex-1 rounded-pill bg-ink px-6 py-4 text-[15px] font-semibold text-night transition-colors hover:bg-ember"
              >
                Add to bag
              </button>
            ) : (
              <a
                href={askUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[180px] flex-1 rounded-pill border border-ember/60 px-6 py-4 text-center text-[15px] font-semibold text-ember transition-colors hover:bg-ember hover:text-night"
              >
                Currently unavailable — ask on WhatsApp
              </a>
            )}
            <button
              onClick={() => setWallOpen(true)}
              className="rounded-pill border border-ink/25 px-[22px] py-4 text-[15px] text-ink transition-colors hover:border-ink"
            >
              See it on a wall
            </button>
          </div>
          <p className="m-0 mt-4 text-[12px] leading-[1.6] text-ink-3">
            A 50% non-refundable deposit is required before production begins; final pricing is confirmed with you on
            WhatsApp.
          </p>
        </div>
      </div>

      {/* floating price pill */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[22px] z-[800] flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto relative w-[min(560px,calc(100%-24px))]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-2.5 -inset-y-[30px] rounded-pill blur-[20px]"
          style={{ background: "radial-gradient(ellipse at center,rgba(229,138,82,0.45),rgba(229,138,82,0) 70%)" }}
        />
        <div className="relative flex items-center gap-2.5 overflow-hidden rounded-pill border border-ink/[0.12] bg-[rgba(27,24,21,0.9)] py-2 pl-[74px] pr-2 backdrop-blur-[18px] min-[420px]:gap-3.5">
          <div
            ref={discRef}
            className="absolute left-2.5 top-1/2 -mt-[26px] h-[52px] w-[52px] overflow-hidden rounded-full shadow-[0_0_0_3px_#12100E,0_0_0_4px_rgba(239,233,223,0.2)]"
          >
            <Image
              src={art.imageUrl}
              alt=""
              fill
              sizes="52px"
              className="animate-[spin_24s_linear_infinite] object-cover motion-reduce:animate-none"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
              PREVIEWING — {art.name}
            </div>
            <div className="mt-[3px] truncate text-[13px]">{spec}</div>
          </div>
          <div className="whitespace-nowrap font-display text-[22px] min-[420px]:text-[26px]">{formatNaira(total)}</div>
          <button
            onClick={() => setWallOpen(true)}
            className="whitespace-nowrap rounded-pill bg-ink/10 px-3.5 py-[11px] text-[12px] text-ink transition-colors hover:bg-ink/20"
          >
            Wall
          </button>
          {art.available ? (
            <button
              onClick={addToBag}
              className="whitespace-nowrap rounded-pill bg-ember px-4 py-[11px] text-[13px] font-semibold text-night transition-colors hover:bg-ink"
            >
              Add
            </button>
          ) : (
            <a
              href={askUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-pill bg-ember px-4 py-[11px] text-[13px] font-semibold text-night hover:text-night"
            >
              Ask
            </a>
          )}
        </div>
      </motion.div>
      </div>

      <WallPreview
        open={wallOpen}
        onClose={closeWall}
        name={art.name}
        imageUrl={art.imageUrl}
        sizeIndex={sizeIndex}
        onSize={setSizeIndex}
        framed={framed}
        onFramed={setFramed}
      />
    </>
  );
}
