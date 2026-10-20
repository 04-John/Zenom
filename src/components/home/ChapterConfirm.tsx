"use client";

import { useEffect, useState } from "react";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { CATALOG_BY_CODE } from "@/lib/catalog";
import { DEFAULT_SIZE_INDEX, SIZES } from "@/lib/pricing";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";
import { ChapterShell, useChapter } from "./shared";

type Beats = { b0: boolean; typing: boolean; b1: boolean; b2: boolean };
const beats = (p: number): Beats => ({
  b0: p > 0.14,
  typing: (p > 0.3 && p < 0.46) || (p > 0.56 && p < 0.66),
  b1: p > 0.46,
  b2: p > 0.66,
});
const same = (a: Beats, b: Beats) => a.b0 === b.b0 && a.typing === b.typing && a.b1 === b.b1 && a.b2 === b.b2;

const bubble =
  "max-w-[84%] px-[14px] py-[clamp(8px,1.5vh,12px)] text-[clamp(12px,1.8vh,14px)] leading-[1.45]";
const MOVE = { duration: 0.6, ease: [0.16, 1, 0.3, 1] } as const;

export function ChapterConfirm() {
  const reduced = useReducedMotionSafe();
  const { ref, p } = useChapter(reduced);
  const [live, setLive] = useState<Beats>(beats(0));
  const sync = (v: number) => setLive((cur) => (same(cur, beats(v)) ? cur : beats(v)));
  useMotionValueEvent(p, "change", sync);
  useEffect(() => sync(p.get()), [p]); // eslint-disable-line react-hooks/exhaustive-deps
  const b = reduced ? beats(1) : live;

  const glow = useTransform(p, (v) => `translate(${-v * 12}vw, ${v * 10}vh)`);
  const title = CATALOG_BY_CODE.w05?.title ?? "Turtleneck";
  const size = SIZES[DEFAULT_SIZE_INDEX].label.replace("×", " × ");

  const pose = (on: boolean) => ({ opacity: on ? 1 : 0, y: on ? 0 : 24 });

  return (
    <ChapterShell
      ref={ref}
      index={3}
      vh={300}
      reduced={reduced}
      style={{ background: "#12100E", color: "#EFE9DF", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))" }}
      className="grid content-center items-center gap-[clamp(14px,4vw,72px)] px-[clamp(20px,5vw,96px)] pb-6 pt-[84px]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-[10%] top-[10%] h-[70vw] w-[70vw] rounded-full will-change-transform"
        style={{ transform: glow, background: "radial-gradient(circle,rgba(229,138,82,0.22),rgba(229,138,82,0) 60%)" }}
      />
      <div className="relative">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-ember">CHAPTER 04 — CONFIRM</div>
        <h2 className="mt-[14px] font-display text-[clamp(34px,min(5.6vw,9vh),92px)] font-normal italic leading-[0.95]">
          One conversation,
          <br />
          every detail.
        </h2>
        <p className="mt-[clamp(10px,2.5vh,22px)] max-w-[380px] text-[clamp(13px,1.8vh,15px)] leading-[1.65] text-ink-2">
          Your order opens in WhatsApp with every detail filled in. Pricing, timeline and the deposit are agreed there before any work begins.
        </p>
      </div>

      <div className="relative flex w-[min(100%,460px)] flex-col gap-[clamp(6px,1.4vh,12px)] justify-self-center rounded-[28px] border border-ink/[0.08] bg-night-raised p-[clamp(12px,2vh,18px)]">
        <div className="flex items-center gap-[10px] border-b border-ink/[0.08] px-1 pb-3 pt-1">
          <span aria-hidden className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-night">
            <ZenomMark size={22} title="" />
          </span>
          <div>
            <div className="text-sm font-semibold">Zenom Studio</div>
            <div className="font-mono text-[9px] tracking-[0.18em] text-ink-3">WHATSAPP</div>
          </div>
        </div>
        <motion.div
          initial={false}
          animate={pose(b.b0)}
          transition={reduced ? { duration: 0 } : MOVE}
          className={`${bubble} self-end rounded-[18px_18px_4px_18px] bg-ember text-night`}
        >
          Hello Zenom Studio, I&apos;d like to place an order: {title}, {size} in, framed.
        </motion.div>
        {!(b.b2) && (
          <div
            className="flex gap-[5px] self-start rounded-[18px] bg-night-bubble px-4 py-3 transition-opacity duration-300"
            style={{ opacity: b.typing ? 1 : 0 }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-[6px] w-[6px] rounded-full bg-ink-3" />
            ))}
          </div>
        )}
        <motion.div
          initial={false}
          animate={pose(b.b1)}
          transition={reduced ? { duration: 0 } : MOVE}
          className={`${bubble} self-start rounded-[18px_18px_18px_4px] bg-night-bubble`}
        >
          We confirm final pricing and every detail with you directly on WhatsApp.
        </motion.div>
        <motion.div
          initial={false}
          animate={pose(b.b2)}
          transition={reduced ? { duration: 0 } : MOVE}
          className={`${bubble} self-start rounded-[18px_18px_18px_4px] bg-night-bubble`}
        >
          A 50% non-refundable deposit is required before production begins.
        </motion.div>
      </div>
    </ChapterShell>
  );
}
