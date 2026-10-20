"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import { art } from "@/lib/catalog";
import { clamp01, easeInOutCubic } from "@/lib/motion";
import { artworkPrice, DELIVERY_KADUNA, formatNaira, framingPrice, SIZES } from "@/lib/pricing";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";
import { ChapterShell, useChapter } from "./shared";

const LAST = SIZES.length - 1;

type Geo = { left: number; w: number; h: number; bottom: number; benchW: number; benchH: number; tagLeft: number };

export function ChapterSize() {
  const reduced = useReducedMotionSafe();
  const { ref, p } = useChapter(reduced);
  const dims = useMotionValue({ W: 1440, H: 900 });

  // Stage size is measured on resize only.
  useEffect(() => {
    const el = ref.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const measure = () => dims.set({ W: el.clientWidth, H: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dims, ref, reduced]);

  const [shown, setShown] = useState(0);
  const sync = (v: number) => {
    const i = Math.round(clamp01((v - 0.08) / 0.84) * LAST);
    setShown((cur) => (cur === i ? cur : i));
  };
  useMotionValueEvent(p, "change", sync);
  useEffect(() => sync(p.get()), [p]); // eslint-disable-line react-hooks/exhaustive-deps
  const idx = reduced ? LAST : shown;

  const geo = useTransform((): Geo => {
    const v = p.get();
    const { W, H } = dims.get();
    const f = clamp01((v - 0.08) / 0.84) * LAST;
    const a = Math.min(LAST - 1, Math.floor(f));
    const e = easeInOutCubic(f - a);
    const wIn = SIZES[a].widthIn + (SIZES[a + 1].widthIn - SIZES[a].widthIn) * e;
    const hIn = SIZES[a].heightIn + (SIZES[a + 1].heightIn - SIZES[a].heightIn) * e;
    const ppi = Math.min(W / 150, (H * 0.86 - 110) / 70);
    const floorY = H * 0.14;
    const cx = W > 900 ? W * 0.66 : W * 0.5;
    return { left: cx, w: wIn * ppi, h: hIn * ppi, bottom: floorY + 30 * ppi, benchW: 48 * ppi, benchH: 18 * ppi, tagLeft: cx + 25 * ppi };
  });
  const artLeft = useTransform(geo, (g) => g.left);
  const artW = useTransform(geo, (g) => g.w);
  const artH = useTransform(geo, (g) => g.h);
  const artBottom = useTransform(geo, (g) => g.bottom);
  const benchW = useTransform(geo, (g) => g.benchW);
  const benchH = useTransform(geo, (g) => g.benchH);
  const tagLeft = useTransform(geo, (g) => g.tagLeft);

  const art_ = artworkPrice("portrait", idx);
  const framedDelivered = art_ + framingPrice(idx, true) + DELIVERY_KADUNA;

  return (
    <ChapterShell
      ref={ref}
      index={2}
      vh={380}
      reduced={reduced}
      style={{ background: "linear-gradient(#DDD4C5,#CFC5B4)", color: "#1A1714" }}
    >
      <div className="absolute inset-x-0 bottom-0 h-[14%] bg-[#7E644B]" />
      <div className="absolute inset-x-0 bottom-[14%] h-[10px] bg-[#EAE3D6]" />
      <motion.div
        className="absolute bottom-[14%] -translate-x-1/2 rounded-[10px_10px_2px_2px] bg-[#2A2420]"
        style={{ left: artLeft, width: benchW, height: benchH, x: "-50%" }}
      />
      <motion.div
        className="absolute box-content border-[8px] border-[#2B211A] bg-[#F2EDE4] p-[6px] shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
        style={{ left: artLeft, width: artW, height: artH, bottom: artBottom, x: "-50%" }}
      >
        <div className="relative h-full w-full">
          <Image src={art("w05")} alt="" fill sizes="(max-width:900px) 60vw, 400px" className="object-cover" />
        </div>
      </motion.div>

      <div className="absolute left-[clamp(24px,6vw,96px)] top-[110px] z-[3] max-w-[min(440px,88vw)]">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-rust">CHAPTER 03 — YOUR SIZE</div>
        <h2 className="mt-4 font-display text-[clamp(40px,4.6vw,76px)] font-normal italic leading-[0.95]">
          Choose how large
          <br />
          it lives.
        </h2>
        <motion.div
          key={idx}
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-[clamp(16px,4vh,48px)] font-display text-[clamp(64px,8vw,136px)] leading-none"
        >
          {SIZES[idx].label.replace("×", " × ")}
        </motion.div>
        <div className="mt-[6px] text-sm text-paper-ink-2">
          Artwork {formatNaira(art_)} · framed, delivered in Kaduna {formatNaira(framedDelivered)}
        </div>
        <div className="mt-[22px] flex flex-wrap gap-[6px]">
          {SIZES.map((s, i) => (
            <span
              key={s.label}
              className="rounded-pill border border-paper-ink/25 px-[10px] py-[6px] font-mono text-[10px] tracking-[0.1em] transition-colors"
              style={i === idx ? { background: "#1A1714", color: "#ECE5D8" } : undefined}
            >
              {s.label}
            </span>
          ))}
        </div>
        <Link
          href="/pricing"
          className="mt-[26px] inline-flex items-center rounded-pill bg-paper-ink px-[22px] py-[13px] text-sm font-semibold text-paper transition-colors hover:bg-rust hover:text-paper"
        >
          Full price list
        </Link>
      </div>

      <motion.div
        className="absolute bottom-[calc(14%+16px)] font-mono text-[10px] tracking-[0.12em] text-paper-ink-2"
        style={{ left: tagLeft }}
      >
        BENCH · 48 IN
      </motion.div>
    </ChapterShell>
  );
}
