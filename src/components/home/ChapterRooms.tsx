"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { art, CATALOG } from "@/lib/catalog";
import { mixHex } from "@/lib/motion";
import { formatNaira, startingPrice, type Category } from "@/lib/pricing";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";
import { ChapterShell, useChapter } from "./shared";

type Room = { category: Category; label: string; blurb: string; href: string; images: [string, string, string] };

// Copy and artwork picks follow the design reference's `collections`.
const ROOMS: Room[] = [
  {
    category: "portrait",
    label: "Portraits",
    blurb: "Commissioned charcoal and pencil portraits, made to order from your photograph.",
    href: "/portraits",
    images: ["w02", "w06", "w04"],
  },
  {
    category: "geometric",
    label: "Geometric",
    blurb: "Hard edges, circles and patterned fills in colour pencil and ink.",
    href: "/abstract?style=geometric",
    images: ["g07", "g01", "g03"],
  },
  {
    category: "minimalistic",
    label: "Minimalistic",
    blurb: "Line, flat colour and a lot of quiet space.",
    href: "/abstract?style=minimalistic",
    images: ["m06", "m03", "m04"],
  },
  {
    category: "figurative",
    label: "Figurative",
    blurb: "Plants, stones, flowers and landscapes, drawn with patterned line.",
    href: "/abstract?style=figurative",
    images: ["f09", "f05", "f03"],
  },
];

const BG = ["#ECE5D8", "#171310", "#1B2340", "#4A1618", "#15302A"];
const INK = ["#1A1714", "#EFE9DF", "#EFE9DF", "#EFE9DF", "#EFE9DF"];
const PAD = "clamp(24px,6vw,96px)";

const countFor = (c: Category) => String(CATALOG.filter((a) => a.category === c).length).padStart(2, "0");

type Metrics = { dist: number; vw: number };

// One of the three stacked artworks in a panel; drifts horizontally against the track.
function ParImg({
  src,
  kx,
  rot,
  className,
  p,
  metrics,
  center,
  reduced,
}: {
  src: string;
  kx: number;
  rot: number;
  className: string;
  p: MotionValue<number>;
  metrics: MotionValue<Metrics>;
  center: MotionValue<number>;
  reduced: boolean;
}) {
  const transform = useTransform(() => {
    const pv = p.get();
    const m = metrics.get();
    const c = center.get();
    const ep = pv < 0.04 ? 0 : Math.min(1, (pv - 0.04) / 0.92);
    const off = c - ep * m.dist - m.vw / 2;
    return `translateX(${-off * kx}px) rotate(${rot + off * 0.006}deg)`;
  });
  return (
    <motion.div
      className={`absolute overflow-hidden rounded-[12px] will-change-transform ${className}`}
      style={reduced ? { transform: `rotate(${rot}deg)` } : { transform }}
    >
      <Image src={src} alt="" fill loading="eager" sizes="(max-width:900px) 40vw, 360px" className="object-cover" />
    </motion.div>
  );
}

function Panel({
  room,
  index,
  p,
  metrics,
  reduced,
}: {
  room: Room;
  index: number;
  p: MotionValue<number>;
  metrics: MotionValue<Metrics>;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const center = useMotionValue(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => center.set(el.offsetLeft + el.offsetWidth / 2);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [center]);

  const [i1, i2, i3] = room.images;
  const shadow = "shadow-[0_30px_70px_rgba(0,0,0,0.45)]";
  return (
    <div
      ref={ref}
      data-panel
      className={
        reduced
          ? "relative grid min-h-screen content-center items-center gap-[clamp(20px,4vw,56px)] px-[clamp(24px,5vw,72px)] py-24"
          : "relative grid h-full flex-none content-center items-center gap-[clamp(20px,4vw,56px)] px-[clamp(24px,5vw,72px)] pb-[72px] pt-[90px]"
      }
      style={{
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))",
        ...(reduced ? { background: BG[index + 1], color: INK[index + 1] } : { flex: "0 0 min(94vw,1180px)" }),
      }}
    >
      <div className="relative z-[2]">
        <div className="font-display text-[clamp(80px,12vw,190px)] leading-[0.8] opacity-[0.14]">0{index + 1}</div>
        <div className="mt-[14px] font-mono text-[10px] uppercase tracking-[0.24em] opacity-70">{countFor(room.category)} WORKS</div>
        <div className="mt-[10px] font-display text-[clamp(52px,6.5vw,108px)] font-normal italic leading-[0.9]">{room.label}</div>
        <p className="mt-[18px] max-w-[360px] text-[15px] leading-[1.7] opacity-75">{room.blurb}</p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            href={room.href}
            data-cursor="Enter"
            className="inline-flex items-center rounded-pill bg-ink px-6 py-[14px] text-sm font-semibold text-night transition-colors hover:bg-ember hover:text-night"
          >
            Enter the room
          </Link>
          <span className="text-[13px] opacity-75">from {formatNaira(startingPrice(room.category))}</span>
        </div>
      </div>
      <div className="relative h-[min(56vh,580px)] min-h-[300px]">
        <ParImg src={art(i2)} kx={0.14} rot={7} className={`right-0 top-0 aspect-[3/4] w-[40%] ${shadow}`} {...{ p, metrics, center, reduced }} />
        <ParImg src={art(i3)} kx={0.24} rot={-9} className={`bottom-0 left-0 aspect-[3/4] w-[38%] ${shadow}`} {...{ p, metrics, center, reduced }} />
        <ParImg
          src={art(i1)}
          kx={0.05}
          rot={-2}
          className="left-[22%] top-[7%] aspect-[4/5] w-[52%] shadow-[0_40px_90px_rgba(0,0,0,0.55)]"
          {...{ p, metrics, center, reduced }}
        />
      </div>
    </div>
  );
}

function Intro() {
  return (
    <>
      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-ember">CHAPTER 02 — FOUR ROOMS</div>
      <h2 className="mt-[18px] font-display text-[clamp(48px,6vw,100px)] font-normal italic leading-[0.92]">
        Four rooms
        <br />
        in one studio.
      </h2>
      <p className="mt-[22px] max-w-[380px] text-[15px] leading-[1.7] opacity-[0.72]">
        Portraits are drawn from your photograph. Abstract pieces are graphite and colour-pencil recreations of a chosen or client-supplied reference.
      </p>
    </>
  );
}

export function ChapterRooms() {
  const reduced = useReducedMotionSafe();
  const { ref, p } = useChapter(reduced);
  const trackRef = useRef<HTMLDivElement>(null);
  const metrics = useMotionValue<Metrics>({ dist: 0, vw: 1440 });

  // Track width is measured on resize, never during scroll.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => metrics.set({ dist: Math.max(0, track.scrollWidth - window.innerWidth), vw: window.innerWidth });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [metrics, reduced]);

  const ep = useTransform(p, (v) => (v < 0.04 ? 0 : Math.min(1, (v - 0.04) / 0.92)));
  const x = useTransform(() => -ep.get() * metrics.get().dist);
  const mix = (v: number) => {
    const f = v * (BG.length - 1);
    const i = Math.min(BG.length - 2, Math.floor(f));
    const fr = f - i;
    const sm = fr * fr * (3 - 2 * fr);
    return { i, k: Math.max(0, Math.min(1, (sm - 0.25) / 0.5)) };
  };
  const bg = useTransform(ep, (v) => {
    const { i, k } = mix(v);
    return mixHex(BG[i], BG[i + 1], k);
  });
  const color = useTransform(ep, (v) => {
    const { i, k } = mix(v);
    return mixHex(INK[i], INK[i + 1], k);
  });

  if (reduced) {
    return (
      <ChapterShell ref={ref} index={1} vh={460} reduced style={{ background: BG[0], color: INK[0] }} className="!overflow-visible">
        <div className="flex min-h-screen flex-col justify-center px-[clamp(24px,6vw,96px)] py-28">
          <Intro />
        </div>
        {ROOMS.map((r, i) => (
          <Panel key={r.category} room={r} index={i} p={p} metrics={metrics} reduced />
        ))}
        <div ref={trackRef} className="hidden" />
      </ChapterShell>
    );
  }

  return (
    <ChapterShell ref={ref} index={1} vh={460} reduced={false} style={{ background: bg, color }}>
      <motion.div ref={trackRef} className="absolute left-0 top-0 flex h-full will-change-transform" style={{ x }}>
        <div className="flex h-full flex-none flex-col justify-center" style={{ flex: "0 0 min(100vw,860px)", padding: `0 ${PAD}` }}>
          <Intro />
          <div className="mt-10 font-mono text-[10px] uppercase tracking-[0.3em] opacity-60">KEEP SCROLLING →</div>
        </div>
        {ROOMS.map((r, i) => (
          <Panel key={r.category} room={r} index={i} p={p} metrics={metrics} reduced={false} />
        ))}
      </motion.div>
      <div className="absolute bottom-[30px] h-px bg-current opacity-[0.18]" style={{ left: PAD, right: PAD }} />
      <motion.div className="absolute bottom-[30px] h-px origin-left bg-ember" style={{ left: PAD, right: PAD, scaleX: ep }} />
    </ChapterShell>
  );
}
