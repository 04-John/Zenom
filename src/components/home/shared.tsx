"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useScroll, type MotionStyle, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { WHATSAPP_NUMBER } from "@/lib/pricing";

export const WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

/**
 * Scroll progress of a pinned chapter (0 at the moment its sticky stage locks,
 * 1 when it releases). Under reduced motion it is pinned to 1 = final state.
 */
export function useChapter(reduced: boolean) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const final = useMotionValue(1);
  const p: MotionValue<number> = reduced ? final : scrollYProgress;
  return { ref, p };
}

type ShellProps = {
  index: number;
  /** Section height in vh while pinned */
  vh: number;
  reduced: boolean;
  className?: string;
  style?: MotionStyle;
  children: ReactNode;
  sectionStyle?: CSSProperties;
};

/** Tall section + sticky 100vh stage. Not pinned under reduced motion. */
export const ChapterShell = forwardRef<HTMLElement, ShellProps>(function ChapterShell(
  { index, vh, reduced, className, style, children, sectionStyle },
  ref
) {
  return (
    <section
      ref={ref}
      data-chapter={index}
      className="relative z-[2]"
      style={{ height: reduced ? undefined : `${vh}vh`, ...sectionStyle }}
    >
      <motion.div
        className={cn("overflow-hidden", reduced ? "relative min-h-screen" : "sticky top-0 h-screen", className)}
        style={style}
      >
        {children}
      </motion.div>
    </section>
  );
});
