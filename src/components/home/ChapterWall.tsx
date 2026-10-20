"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useTransform } from "framer-motion";
import { art, CATALOG } from "@/lib/catalog";
import { clamp01 } from "@/lib/motion";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";
import { ChapterShell, useChapter, WA_LINK } from "./shared";

export function ChapterWall() {
  const reduced = useReducedMotionSafe();
  const { ref, p } = useChapter(reduced);

  const k = useTransform(p, (v) => clamp01(v / 0.4));
  const c = useTransform(p, (v) => clamp01((v - 0.38) / 0.18));
  const brightness = useTransform(k, (v) => `brightness(${0.2 + 0.8 * v})`);
  const artTransform = useTransform(k, (v) => `translateY(${(1 - v) * -30}px) scale(${0.94 + 0.06 * v})`);
  const ctaY = useTransform(c, (v) => (1 - v) * 40);

  return (
    <ChapterShell
      ref={ref}
      index={4}
      vh={240}
      reduced={reduced}
      style={{ background: "#0C0B09", color: "#EFE9DF" }}
      className="flex flex-col items-center justify-center px-6 pb-6 pt-[76px] text-center"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[120%] w-[min(1100px,140vw)] -translate-x-1/2"
        style={{
          x: "-50%",
          opacity: k,
          background: "radial-gradient(ellipse 40% 55% at 50% 40%,rgba(239,226,205,0.22),rgba(239,226,205,0) 70%)",
        }}
      />
      <motion.div
        className="relative box-border h-[min(34vh,440px)] border-[10px] border-[#2B211A] bg-[#F2EDE4] p-2 shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
        style={{ aspectRatio: "4/5", filter: brightness, transform: artTransform }}
      >
        <div className="relative h-full w-full">
          <Image src={art("w05")} alt="" fill sizes="300px" className="object-cover" />
        </div>
      </motion.div>
      <motion.div className="relative mt-[clamp(14px,3.5vh,40px)]" style={{ opacity: c, y: ctaY }}>
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-ember">CHAPTER 05 — ON YOUR WALL</div>
        <h2 className="mt-[10px] font-display text-[clamp(36px,min(6.5vw,8.5vh),104px)] font-normal italic leading-[0.92]">
          Let’s commission
          <br />
          something.
        </h2>
        <div className="mt-[clamp(14px,3vh,28px)] flex flex-wrap justify-center gap-[10px]">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noreferrer"
            data-cursor="Talk"
            className="inline-flex items-center rounded-pill bg-ember px-[26px] py-[15px] text-[15px] font-semibold text-night transition-colors hover:bg-ink hover:text-night"
          >
            Start a commission
          </a>
          <Link
            href="/portfolio"
            className="inline-flex items-center rounded-pill border border-ink/25 px-6 py-[15px] text-[15px] text-ink transition-colors hover:border-ink"
          >
            Browse all {CATALOG.length} works
          </Link>
        </div>
      </motion.div>
    </ChapterShell>
  );
}
