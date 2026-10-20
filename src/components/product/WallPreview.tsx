"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { SIZES } from "@/lib/pricing";
import { useScrollLock } from "@/components/motion/LenisProvider";

const WALL_IN = 140; // wall width the artwork is drawn against
const BENCH_IN = 48;
const pct = (inches: number) => `${((inches / WALL_IN) * 100).toFixed(2)}%`;

// To-scale preview: the piece on a 140-inch-wide wall above a 48-inch bench.
// Size chips and the frame toggle re-animate the artwork over 500ms.
export function WallPreview({
  open,
  onClose,
  name,
  imageUrl,
  sizeIndex,
  onSize,
  framed,
  onFramed,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  imageUrl: string;
  sizeIndex: number;
  onSize: (i: number) => void;
  framed: boolean;
  onFramed: (v: boolean) => void;
}) {
  useScrollLock(open);
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
        <motion.div
          key="wall"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} on a wall`}
          data-lenis-prevent
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={onClose}
          className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[rgba(8,7,6,0.82)] p-5 backdrop-blur-[8px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="my-auto w-[min(1100px,100%)] overflow-hidden rounded-[28px] border border-ink/10 bg-night-raised"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-[22px] py-[18px]">
              <div>
                <div className="font-mono text-[10px] tracking-[0.2em] text-ink-3">ON A WALL — TO SCALE</div>
                <div className="mt-0.5 font-display text-[28px] italic">
                  {name}, {size.label} in
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {SIZES.map((s, i) => (
                  <button
                    key={s.label}
                    onClick={() => onSize(i)}
                    aria-pressed={i === sizeIndex}
                    className={`rounded-pill border px-3 py-[7px] text-[12px] transition-colors ${
                      i === sizeIndex
                        ? "border-ink bg-ink text-night"
                        : "border-ink/[0.16] text-ink hover:border-ink/50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={() => onFramed(!framed)}
                  className="rounded-pill border border-ink/20 px-3 py-[7px] text-[12px] text-ink transition-colors hover:border-ink"
                >
                  {framed ? "Framed" : "Unframed"}
                </button>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  className="rounded-pill bg-ink px-3.5 py-[7px] text-[12px] font-semibold text-night"
                >
                  Close
                </button>
              </div>
            </div>

            <div
              className="relative overflow-hidden"
              style={{ height: "min(62vh,560px)", background: "linear-gradient(#DCD3C4,#CFC5B4)" }}
            >
              <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[#8A6E52]" />
              <div className="absolute inset-x-0 bottom-[16%] h-2.5 bg-[#EDE6DA]" />
              <div
                className="absolute bottom-[16%] left-1/2 h-[22%] -translate-x-1/2 rounded-t-[8px] rounded-b-[2px] bg-[#2A2420]"
                style={{ width: pct(BENCH_IN) }}
              />
              <div
                className="absolute left-1/2 shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-all duration-500 ease-[cubic-bezier(.2,.7,.2,1)]"
                style={{
                  bottom: "47%",
                  transform: "translateX(-50%)",
                  width: pct(size.widthIn),
                  aspectRatio: `${size.widthIn} / ${size.heightIn}`,
                  boxSizing: "content-box",
                  border: framed ? "8px solid #2B211A" : "0px solid #2B211A",
                  padding: framed ? 6 : 0,
                  background: "#F2EDE4",
                }}
              >
                <div className="relative h-full w-full">
                  <Image src={imageUrl} alt="" fill sizes="(max-width: 1100px) 30vw, 330px" className="object-cover" />
                </div>
              </div>
              <div className="absolute bottom-[calc(16%+18px)] right-[18px] font-mono text-[10px] tracking-[0.12em] text-paper-ink-2">
                BENCH · 48 IN WIDE
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
