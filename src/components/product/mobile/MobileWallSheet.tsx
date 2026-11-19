"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useScrollLock } from "@/components/motion/LenisProvider";
import { CloseIcon } from "@/components/storefront-mobile/icons";
import { SIZES } from "@/lib/pricing";

const EASE = [0.16, 1, 0.3, 1] as const;
const EASE_CSS = "cubic-bezier(.16,1,.3,1)";

// Wall drawing in design units (a 480px-tall wall on a 390px phone). The whole
// scene scales down on short screens, keeping 5.5px per inch at full size.
const WALL_H = 480;
const PPI = 5.5;
const BENCH_IN = 48;

type Props = {
  open: boolean;
  onClose: () => void;
  name: string;
  imageUrl: string;
  sizeIndex: number;
  onSize: (i: number) => void;
  framed: boolean;
  priceLine: string;
  cta: ReactNode;
};

// "On a wall · to scale" (reference: Wall / Prototype "wall"): a full-height
// sheet that slides up (zSheetIn) over the artwork page. The piece hangs above
// a 48-inch bench and resizes over 0.6s when a size chip is picked.
export function MobileWallSheet({ open, onClose, name, imageUrl, sizeIndex, onSize, framed, priceLine, cta }: Props) {
  useScrollLock(open);
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  const size = SIZES[sizeIndex];

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="wall"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} on a wall, to scale`}
          data-lenis-prevent
          initial={{ y: "100%" }}
          animate={{ y: 0, transition: reduce ? { duration: 0 } : { duration: 0.65, ease: EASE } }}
          exit={{ y: "100%", transition: reduce ? { duration: 0 } : { duration: 0.55, ease: EASE } }}
          className="fixed inset-0 z-[960] flex flex-col overflow-y-auto overscroll-contain bg-night text-ink min-[900px]:hidden"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <header className="flex h-14 flex-none items-center justify-between pl-6 pr-2">
            <span className="zk text-ink-3">On a wall · to scale</span>
            <button
              ref={closeRef}
              type="button"
              aria-label="Close wall preview"
              onClick={onClose}
              className="zb zf flex h-11 w-11 items-center justify-center rounded-full text-ink"
            >
              <CloseIcon />
            </button>
          </header>

          <Wall name={name} imageUrl={imageUrl} sizeIndex={sizeIndex} framed={framed} />

          <div className="flex flex-1 flex-col gap-4 px-6 pt-5" style={{ paddingBottom: "calc(28px + env(safe-area-inset-bottom))" }}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="zn text-[26px] leading-none">
                {size.widthIn} × {size.heightIn} in
              </span>
              <span className="text-right text-[13px] text-ink-2">{priceLine}</span>
            </div>
            <div role="group" aria-label="Size in inches" className="grid grid-cols-6 gap-1.5">
              {SIZES.map((s, i) => {
                const on = i === sizeIndex;
                return (
                  <button
                    key={s.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onSize(i)}
                    className={`zb zf h-11 rounded-[12px] border text-center text-[11px] font-medium transition-colors duration-300 ${
                      on ? "border-ink bg-ink text-night" : "border-ink/[0.16] text-ink-2"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-auto pt-2">{cta}</div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Wall({ name, imageUrl, sizeIndex, framed }: { name: string; imageUrl: string; sizeIndex: number; framed: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setK(Math.min(1, el.clientHeight / WALL_H) || 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = SIZES[sizeIndex];
  const u = (v: number) => v * k;
  const W = u(s.widthIn * PPI + (framed ? 20 : 0));
  const H = u(s.heightIn * PPI + (framed ? 20 : 0));
  const benchW = u(BENCH_IN * PPI);

  return (
    <div
      ref={ref}
      className="relative flex-none overflow-hidden"
      style={{ height: "clamp(300px, calc(100svh - 290px), 480px)", background: "linear-gradient(180deg,#DDD4C5 0%,#CFC5B4 100%)" }}
    >
      <div
        aria-hidden
        className="absolute left-1/2 rounded-full"
        style={{
          top: u(-40),
          width: u(300),
          height: u(300),
          marginLeft: -u(150),
          background: "radial-gradient(circle, rgba(255,250,240,.55) 0%, rgba(255,250,240,0) 70%)",
        }}
      />
      <div
        className="absolute left-1/2 box-border"
        style={{
          top: u(245) - H,
          width: W,
          height: H,
          marginLeft: -W / 2,
          border: framed ? `${u(4)}px solid #2B211A` : "0px solid #2B211A",
          padding: framed ? u(6) : 0,
          background: framed ? "#F2EDE4" : "transparent",
          boxShadow: "0 18px 36px rgba(0,0,0,.28)",
          transition: `all .6s ${EASE_CSS}`,
        }}
      >
        <div className="relative h-full w-full overflow-hidden">
          <Image src={imageUrl} alt={`${name} on a wall, ${s.label} in`} fill sizes="200px" className="object-cover" />
        </div>
      </div>
      <div aria-hidden className="absolute left-1/2 flex flex-col" style={{ top: u(311), width: benchW, height: u(99), marginLeft: -benchW / 2 }}>
        <div className="rounded-[4px] bg-[#2A2420]" style={{ height: u(14) }} />
        <div className="flex flex-1 justify-between" style={{ padding: `0 ${u(18)}px` }}>
          <span className="bg-[#2A2420]" style={{ width: u(8) }} />
          <span className="bg-[#2A2420]" style={{ width: u(8) }} />
        </div>
      </div>
      <div aria-hidden className="absolute inset-x-0 bg-[#EAE3D6]" style={{ top: u(402), height: u(8) }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 bg-[#7E644B]" style={{ top: u(410) }} />
      <span aria-hidden className="zk absolute right-4 text-[9px] text-paper-ink-2" style={{ top: u(382) }}>
        Bench · {BENCH_IN} in
      </span>
    </div>
  );
}
