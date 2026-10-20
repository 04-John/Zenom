"use client";

import { createElement, useEffect, useLayoutEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { motionClock } from "@/lib/motion";

export type RevealVariant = "up" | "mask" | "blur" | "toss" | "pop" | "fade" | "rise";

const DURATION: Record<RevealVariant, number> = {
  up: 1000,
  mask: 1300,
  blur: 1500,
  toss: 1200,
  pop: 700,
  fade: 500,
  rise: 1600,
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function keyframes(variant: RevealVariant): Keyframe[] {
  const r = Math.random() * 2 - 1;
  switch (variant) {
    case "mask":
      return [
        { opacity: 0, transform: "translateY(40px) skewY(2.5deg)", clipPath: "inset(-20% -10% 100% -10%)" },
        { opacity: 1, transform: "translateY(0) skewY(0deg)", clipPath: "inset(-20% -10% -30% -10%)" },
      ];
    case "blur":
      return [
        { opacity: 0, filter: "blur(16px)", transform: "scale(1.05)" },
        { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
      ];
    case "toss":
      return [
        { opacity: 0, transform: `translate(${r * 60}px,90px) rotate(${r * 9}deg) scale(.94)` },
        { opacity: 1, transform: "translate(0px,0px) rotate(0deg) scale(1)" },
      ];
    case "pop":
      return [
        { opacity: 0, transform: "scale(.92) translateY(18px)" },
        { opacity: 1, transform: "scale(1) translateY(0px)" },
      ];
    case "fade":
      return [{ opacity: 0 }, { opacity: 1 }];
    case "rise":
      return [{ transform: "translateY(55%)" }, { transform: "translateY(0%)" }];
    default:
      return [
        { opacity: 0, transform: "translateY(46px)" },
        { opacity: 1, transform: "translateY(0px)" },
      ];
  }
}

/**
 * Plays a reveal once when `target` (default: the element itself) scrolls
 * into view (rootMargin −6% bottom). Reveals are queued 70ms apart across
 * the whole page. Primed before paint so there is no flash of content, and
 * skipped entirely for prefers-reduced-motion.
 */
export function useReveal<T extends HTMLElement>(variant: RevealVariant, target?: React.RefObject<HTMLElement>) {
  const ref = useRef<T>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Server markup carries `rv-hidden` (opacity 0) so nothing flashes before
    // hydration; it is lifted here, either by priming the animation or,
    // when motion is off, immediately.
    if (typeof el.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.remove("rv-hidden");
      return;
    }

    const anim = el.animate(keyframes(variant), {
      duration: DURATION[variant],
      easing: "cubic-bezier(.16,1,.3,1)",
      fill: "both",
    });
    anim.pause();
    anim.currentTime = 0;
    el.classList.remove("rv-hidden");

    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const now = performance.now();
        const start = Math.max(now, motionClock.revealSlot);
        motionClock.revealSlot = start + 70;
        timer = setTimeout(() => {
          anim.onfinish = () => anim.cancel();
          anim.play();
        }, start - now);
      },
      { rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(target?.current ?? el);

    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
      anim.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  return ref;
}

export function Reveal({
  children,
  variant = "up",
  as = "div",
  className,
  style,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  const outer = useRef<HTMLElement>(null);
  const inner = useReveal<HTMLElement>(variant, variant === "rise" ? outer : undefined);

  if (variant === "rise") {
    // The line rises inside an overflow-hidden parent, which is the element observed.
    return createElement(
      as,
      { ref: outer, className: cn("overflow-hidden", className), style },
      createElement("span", { ref: inner, className: "rv-hidden block" }, children)
    );
  }
  return createElement(as, { ref: inner, className: cn("rv-hidden", className), style }, children);
}
