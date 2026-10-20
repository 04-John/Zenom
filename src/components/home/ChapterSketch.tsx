"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { art, CATALOG_BY_CODE } from "@/lib/catalog";
import { clamp01, easeOutCubic, mixHex } from "@/lib/motion";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";
import { ChapterShell, useChapter } from "./shared";

const STEPS = [
  { n: "01", label: "Sketch", at: 0.12 },
  { n: "02", label: "Shade", at: 0.34 },
  { n: "03", label: "Finish", at: 0.8 },
];

export function ChapterSketch() {
  const reduced = useReducedMotionSafe();
  const { ref, p } = useChapter(reduced);
  const title = CATALOG_BY_CODE.w05?.title ?? "";

  const bg = useTransform(p, (v) => mixHex("#12100E", "#ECE5D8", clamp01(v / 0.16)));
  const color = useTransform(p, (v) => mixHex("#EFE9DF", "#1A1714", clamp01(v / 0.16)));
  const sheet = useTransform(p, (v) => {
    const e = easeOutCubic(clamp01(v / 0.22));
    return `translateY(${(1 - e) * 45}vh) rotate(${(1 - e) * -9}deg) scale(${0.55 + 0.45 * e})`;
  });
  const sketchClip = useTransform(p, (v) => `inset(0 ${(1 - clamp01((v - 0.12) / 0.2)) * 100}% 0 0)`);
  const shadeClip = useTransform(p, (v) => `inset(0 0 ${(1 - clamp01((v - 0.34) / 0.46)) * 100}% 0)`);
  const tip = useTransform(p, (v) => {
    const qs = clamp01((v - 0.12) / 0.2);
    const q = clamp01((v - 0.34) / 0.46);
    if (q > 0 && q < 1) return { on: 1, x: 50 + Math.sin(q * 80) * 44, y: q * 100 };
    if (qs > 0 && qs < 1) return { on: 1, x: qs * 100, y: 50 + Math.sin(qs * 34) * 40 };
    return { on: 0, x: 0, y: 0 };
  });
  const tipOpacity = useTransform(tip, (t) => t.on);
  const tipLeft = useTransform(tip, (t) => `${t.x}%`);
  const tipTop = useTransform(tip, (t) => `${t.y}%`);
  const signK = useTransform(p, (v) => clamp01((v - 0.82) / 0.08));
  const signY = useTransform(signK, (k) => (1 - k) * 10);

  // Which steps are lit: only re-render when one flips.
  const [lit, setLit] = useState(reduced ? 3 : 0);
  const sync = (v: number) => {
    const n = STEPS.filter((s) => v > s.at).length;
    setLit((cur) => (cur === n ? cur : n));
  };
  useMotionValueEvent(p, "change", sync);
  useEffect(() => sync(p.get()), [p]); // eslint-disable-line react-hooks/exhaustive-deps
  const litNow = reduced ? 3 : lit;

  return (
    <ChapterShell
      ref={ref}
      index={0}
      vh={340}
      reduced={reduced}
      style={{ background: bg, color, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))" }}
      className="grid items-center content-center gap-[clamp(16px,4vw,56px)] px-[clamp(20px,5vw,96px)] pb-6 pt-[84px]"
    >
      <div className="relative z-[3] max-w-[540px]">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-ember">CHAPTER 01 — THE BLANK SHEET</div>
        <h2 className="mt-[14px] font-display text-[clamp(36px,min(5.6vw,9vh),92px)] font-normal italic leading-[0.95]">
          Every piece begins
          <br />
          as a blank sheet.
        </h2>
        <p className="mt-[clamp(10px,2.5vh,22px)] max-w-[380px] text-[clamp(13px,1.8vh,15px)] leading-[1.65] opacity-[0.72]">
          Samuel works in charcoal, graphite and colour pencil. Every piece is sketched, shaded and finished by hand, then delivered.
        </p>
        <div className="mt-[clamp(14px,4vh,40px)] flex gap-[clamp(18px,3vw,36px)]">
          {STEPS.map((s, i) => (
            <div key={s.n} className="transition-opacity duration-500" style={{ opacity: i < litNow ? 1 : 0.25 }}>
              <div className="font-mono text-[10px] tracking-[0.2em]">{s.n}</div>
              <div className="mt-1 font-display text-[32px] font-normal italic">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex h-[min(40vh,420px)] items-center justify-center min-[720px]:h-[min(76vh,700px)]">
        <motion.div
          className="relative h-full max-w-full bg-[#F4EFE6] will-change-transform"
          style={{ aspectRatio: "4/5", transform: sheet, boxShadow: "0 40px 100px rgba(0,0,0,0.35)" }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ clipPath: sketchClip, filter: "grayscale(1) contrast(0.32) brightness(1.6)" }}
          >
            <Image src={art("w05")} alt="" fill loading="eager" sizes="(max-width:900px) 70vw, 560px" className="object-cover" />
          </motion.div>
          <motion.div className="absolute inset-0" style={{ clipPath: shadeClip }}>
            <Image src={art("w05")} alt={title} fill loading="eager" sizes="(max-width:900px) 70vw, 560px" className="object-cover" />
          </motion.div>
          <motion.div
            className="absolute h-[10px] w-[10px] rounded-full bg-ember"
            style={{
              left: tipLeft,
              top: tipTop,
              opacity: reduced ? 0 : tipOpacity,
              margin: "-5px 0 0 -5px",
              boxShadow: "0 0 20px 6px rgba(229,138,82,0.65)",
            }}
          />
          <motion.div
            className="absolute bottom-[2.5%] right-[5%] font-display text-[30px] italic text-paper-ink"
            style={{ opacity: signK, y: signY }}
          >
            Zenom
          </motion.div>
        </motion.div>
      </div>
    </ChapterShell>
  );
}
