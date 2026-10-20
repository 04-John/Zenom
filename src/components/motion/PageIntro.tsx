"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useScroll, useTransform, type MotionValue } from "framer-motion";
import { clamp01, mixHex, motionClock } from "@/lib/motion";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";

export type PageIntroProps = {
  kicker: string;
  title: string;
  blurb: string;
  /** World colour of the page (e.g. paper "#ECE5D8", ember "#E58A52"). */
  bg: string;
  /** Text colour on that world. */
  ink: string;
  /** Up to 5 artwork image URLs that fly around the copy. */
  images: string[];
};

const NIGHT = "#12100E";
const INK = "#EFE9DF";

// The 190vh pinned scene that opens every inner page: kicker, big title and
// blurb centred on the page's world colour, framed by artwork cards on an
// ellipse that clears the copy. Scrolling flies the cards outward (blur, fade)
// and crossfades the world colour into the night base (p 0.45–0.90).
// Port of the reference's sc_intro. Reduced motion renders a plain header.
export function PageIntro({ kicker, title, blurb, bg, ink, images }: PageIntroProps) {
  const reduced = useReducedMotionSafe();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Entrance: 1400ms ease-out-cubic, starting once the loader / page travel is done.
  const ent = useMotionValue(0);
  useEffect(() => {
    const delay = Math.max(0, motionClock.pageStart - performance.now()) / 1000;
    const controls = animate(ent, 1, { duration: 1.4, delay, ease: [0.33, 1, 0.68, 1] });
    return () => controls.stop();
  }, [ent, title]);

  // Viewport size, read on resize only (never inside the scroll transforms).
  const viewport = useRef({ vw: 1280, wh: 800 });
  useEffect(() => {
    const measure = () => {
      viewport.current = { vw: window.innerWidth, wh: window.innerHeight };
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const mix = useTransform(p, (v) => clamp01((v - 0.45) / 0.45));
  const background = useTransform(mix, (k) => mixHex(bg, NIGHT, k));
  const color = useTransform(mix, (k) => mixHex(ink, INK, k));
  const copyOpacity = useTransform([p, ent], ([pv, e]: number[]) => (1 - clamp01((pv - 0.5) / 0.35)) * e);
  const copyTransform = useTransform(
    [p, ent],
    ([pv, e]: number[]) => `translateY(${-pv * 14 + (1 - e) * 6}vh) scale(${1 - pv * 0.12})`
  );
  const copyGlow = useTransform(
    mix,
    (k) => `radial-gradient(ellipse closest-side at 50% 50%, ${mixHex(bg, NIGHT, k)} 55%, transparent 100%)`
  );

  if (reduced) {
    return (
      <section
        className="relative z-[2] flex min-h-[70vh] items-center justify-center px-6 pb-16 pt-32 text-center"
        style={{ background: bg, color: ink }}
      >
        <IntroCopy kicker={kicker} title={title} blurb={blurb} />
      </section>
    );
  }

  return (
    <section ref={ref} className="relative z-[2]" style={{ height: "190vh" }}>
      <motion.div
        className="sticky top-0 flex h-screen items-center justify-center overflow-hidden text-center"
        style={{ background, color }}
      >
        <div className="absolute left-1/2 top-1/2 h-0 w-0">
          {images.slice(0, 5).map((src, i) => (
            <FanCard key={src + i} src={src} index={i} p={p} ent={ent} viewport={viewport} />
          ))}
        </div>
        <motion.div
          className="relative z-[3] max-w-[1100px] px-6"
          style={{ opacity: copyOpacity, transform: copyTransform, background: copyGlow, padding: "7vh 7vw" }}
        >
          <IntroCopy kicker={kicker} title={title} blurb={blurb} />
        </motion.div>
        <div className="absolute bottom-[26px] left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] opacity-60">
          SCROLL
        </div>
      </motion.div>
    </section>
  );
}

function IntroCopy({ kicker, title, blurb }: { kicker: string; title: string; blurb: string }) {
  return (
    <>
      <div className="font-mono text-[11px] uppercase tracking-[0.28em] opacity-80">{kicker}</div>
      <h1
        className="mt-4 font-display italic"
        style={{
          fontSize: "clamp(56px,min(10vw,16vh),168px)",
          lineHeight: 0.9,
          textShadow: "0 10px 40px rgba(0,0,0,0.25)",
        }}
      >
        {title}
      </h1>
      <p className="mx-auto mt-[22px] max-w-[460px] text-[15px] leading-[1.7] opacity-80 [text-wrap:pretty]">{blurb}</p>
    </>
  );
}

const WIDE_ANGLES = [-2.2, -1.25, 1.25, 2.2, Math.PI];
const NARROW_ANGLES = [-2.5, -1.9, -0.64, 0.64, 1.9, 2.5];

function FanCard({
  src,
  index,
  p,
  ent,
  viewport,
}: {
  src: string;
  index: number;
  p: MotionValue<number>;
  ent: MotionValue<number>;
  viewport: React.MutableRefObject<{ vw: number; wh: number }>;
}) {
  const transform = useTransform([p, ent], ([pv, e]: number[]) => {
    const { vw, wh } = viewport.current;
    const narrow = vw < 720;
    const ang = narrow ? NARROW_ANGLES[index % 6] : WIDE_ANGLES[index % 5];
    const rx = (narrow ? 0.42 : 0.4) * vw;
    const ry = (narrow ? 0.4 : 0.36) * wh;
    const grow = 1 + pv * 1.1;
    const x = Math.sin(ang) * rx * grow * e;
    const y = -Math.cos(ang) * ry * grow * e - pv * wh * 0.25;
    const rot = Math.sin(ang) * (10 + pv * 30) * e;
    const scale = (narrow ? 0.6 : 0.78) * (0.8 + 0.2 * e) - pv * 0.1;
    return `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${rot}deg) scale(${scale})`;
  });
  const opacity = useTransform([p, ent], ([pv, e]: number[]) => e * Math.max(0, 0.85 - pv * 1.1));
  const filter = useTransform(p, (pv) => (pv > 0.02 ? `blur(${pv * 10}px)` : "none"));

  return (
    <motion.div
      className="absolute left-0 top-0 aspect-[3/4] overflow-hidden rounded-[14px] shadow-art will-change-transform"
      style={{ width: "clamp(110px,15vw,220px)", transform, opacity, filter }}
    >
      <Image src={src} alt="" fill sizes="(max-width: 720px) 110px, 220px" className="object-cover" />
    </motion.div>
  );
}
