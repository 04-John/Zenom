"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionStyle } from "framer-motion";
import { clamp01 } from "@/lib/motion";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";

type Props = {
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  kicker: string;
  medium: string;
};

// The 230vh pinned scene that opens an artwork page (port of sc_artintro):
// a blurred, darkened copy of the piece behind, the piece zooming 1 -> 1.9 and
// back to ~0.65 as the copy fades. Reduced motion renders a static header.
export function ArtworkIntro(props: Props) {
  const reduced = useReducedMotionSafe();
  return reduced ? <StaticIntro {...props} /> : <PinnedIntro {...props} />;
}

const artBox = {
  height: "min(76vh,820px)",
  maxWidth: "86vw",
} as const;

function Backdrop({ imageUrl, style }: { imageUrl: string; style?: MotionStyle }) {
  return (
    <motion.div
      aria-hidden
      className="absolute"
      style={{ left: "-10%", top: "-10%", width: "120%", height: "120%", ...style }}
    >
      <Image
        src={imageUrl}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        style={{ filter: "blur(48px) brightness(0.35) saturate(1.2)" }}
      />
    </motion.div>
  );
}

function PinnedIntro({ name, imageUrl, width, height, kicker, medium }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const artTransform = useTransform(p, (v) => {
    const z = clamp01(v / 0.45);
    const back = clamp01((v - 0.55) / 0.4);
    const sc = Math.max(0.5, 1 + z * 0.9 - back * 1.25);
    return `translate(-50%,-50%) scale(${sc}) translateY(${back * -6}vh)`;
  });
  const artOpacity = useTransform(p, (v) => 1 - clamp01((v - 0.8) / 0.2));
  const bgTransform = useTransform(p, (v) => `scale(${1.1 + v * 0.2})`);
  const copyOpacity = useTransform(p, (v) => 1 - clamp01(v / 0.22));
  const copyTransform = useTransform(p, (v) => `translateY(${v * 40}px)`);
  const noteOpacity = useTransform(p, (v) => clamp01((v - 0.18) / 0.1) * (1 - clamp01((v - 0.5) / 0.1)));

  return (
    <section ref={ref} className="relative z-[2]" style={{ height: "230vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-night-deep text-ink">
        <Backdrop imageUrl={imageUrl} style={{ transform: bgTransform }} />
        <motion.div
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{
            ...artBox,
            aspectRatio: `${width} / ${height}`,
            transformOrigin: "50% 32%",
            transform: artTransform,
            opacity: artOpacity,
            boxShadow: "0 50px 120px rgba(0,0,0,0.7)",
          }}
        >
          <Image src={imageUrl} alt={name} fill priority sizes="86vw" className="block object-cover" />
        </motion.div>
        <motion.div
          className="absolute top-[110px] font-mono text-[10px] uppercase tracking-[0.3em]"
          style={{ right: "clamp(24px,6vw,96px)", opacity: noteOpacity }}
        >
          UP CLOSE — {medium}
        </motion.div>
        <motion.div
          className="absolute bottom-12 right-6 z-[3]"
          style={{ left: "clamp(24px,6vw,96px)", opacity: copyOpacity, transform: copyTransform }}
        >
          <Copy name={name} kicker={kicker} />
        </motion.div>
      </div>
    </section>
  );
}

function StaticIntro({ name, imageUrl, width, height, kicker }: Props) {
  return (
    <section className="relative z-[2] overflow-hidden bg-night-deep text-ink">
      <Backdrop imageUrl={imageUrl} />
      <div className="relative flex min-h-[70vh] flex-col items-center justify-end gap-10 px-6 pb-16 pt-32 text-center">
        <div className="relative w-[min(60vw,420px)] shadow-[0_50px_120px_rgba(0,0,0,0.7)]" style={{ aspectRatio: `${width} / ${height}` }}>
          <Image src={imageUrl} alt={name} fill priority sizes="420px" className="object-cover" />
        </div>
        <Copy name={name} kicker={kicker} />
      </div>
    </section>
  );
}

function Copy({ name, kicker }: { name: string; kicker: string }) {
  return (
    <>
      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-ember">{kicker}</div>
      <div
        aria-hidden
        className="mt-3 font-display italic"
        style={{
          fontSize: "clamp(56px,min(9vw,15vh),150px)",
          lineHeight: 0.9,
          textShadow: "0 10px 40px rgba(0,0,0,0.4)",
        }}
      >
        {name}
      </div>
      <div className="mt-[18px] font-mono text-[10px] tracking-[0.3em] opacity-70">SCROLL TO MAKE IT YOURS</div>
    </>
  );
}
