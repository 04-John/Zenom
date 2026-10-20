"use client";

import { useEffect, useRef } from "react";
import { MARK_DOT, MARK_FEATURES, MARK_LINE, MARK_LINE_SIMPLE, MARK_VIEWBOX, strokeFor } from "./zenom-mark-paths";

export type ZenomMarkProps = {
  /** rendered size in px (square) */
  size?: number;
  /** line colour */
  ink?: string;
  /** pencil-tip dot colour */
  accent?: string;
  /** force the simplified small-size drawing (auto below 48px) */
  simple?: boolean;
  /**
   * "none"  – static mark
   * "once"  – draws itself once, then rests (use for the intro loader)
   * "loop"  – draws, holds, fades, repeats (use for loading states)
   */
  draw?: "none" | "once" | "loop";
  /** full draw duration in ms (stroke portion of the cycle) */
  duration?: number;
  onDrawn?: () => void;
  className?: string;
  title?: string;
};

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number) => Math.max(0, Math.min(1, v));

export function ZenomMark({
  size = 64,
  ink = "#EFE9DF",
  accent = "#E58A52",
  simple,
  draw = "none",
  duration = 3100,
  onDrawn,
  className,
  title = "Zenom Studio",
}: ZenomMarkProps) {
  const isSimple = simple ?? size < 48;
  const sw = strokeFor(size, isSimple);
  const lineRef = useRef<SVGPathElement>(null);
  const featRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const p = lineRef.current;
    if (draw === "none" || !p) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // rest in the finished state instead of staying undrawn
      p.style.strokeDashoffset = "0";
      p.style.opacity = "1";
      if (featRef.current) featRef.current.style.opacity = "1";
      if (dotRef.current) dotRef.current.style.opacity = "1";
      onDrawn?.();
      return;
    }

    const L = p.getTotalLength();
    // cycle: 4% lead-in, 56% draw, hold, 10% fade (loop only)
    const T = draw === "loop" ? duration / 0.56 : duration / 0.6;
    const t0 = performance.now();
    let raf = 0, done = false;
    p.style.strokeDasharray = "1 2";

    const frame = (now: number) => {
      let c = (now - t0) / T;
      if (draw === "loop") c = c % 1;
      else if (c >= 0.66) c = 0.66;
      const k = ease(clamp((c - 0.04) / 0.56));
      const fade = draw === "loop" && c > 0.9 ? 1 - (c - 0.9) / 0.1 : 1;
      p.style.strokeDashoffset = String(1 - k);
      p.style.opacity = String(fade);
      if (featRef.current) featRef.current.style.opacity = String(clamp((c - 0.62) / 0.04) * fade);
      const d = dotRef.current;
      if (d) {
        const pt = p.getPointAtLength(L * Math.min(k, 1));
        const e = clamp((c - 0.6) / 0.05);
        d.setAttribute("cx", (pt.x + (MARK_DOT.cx - pt.x) * e).toFixed(2));
        d.setAttribute("cy", (pt.y + (MARK_DOT.cy - pt.y) * e).toFixed(2));
        d.style.opacity = String(c < 0.04 ? c / 0.04 : fade);
      }
      if (draw === "once" && c >= 0.66) {
        if (!done) { done = true; onDrawn?.(); }
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [draw, duration, onDrawn]);

  const animated = draw !== "none";

  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
      style={{ display: "block", overflow: "visible", flex: `0 0 ${size}px` }}
    >
      <g fill="none" stroke={ink} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path
          ref={lineRef}
          d={isSimple ? MARK_LINE_SIMPLE : MARK_LINE}
          pathLength={1}
          style={animated ? { strokeDasharray: "1 2", strokeDashoffset: 1 } : undefined}
        />
        {!isSimple && (
          <path ref={featRef} d={MARK_FEATURES} strokeWidth={sw * 0.55} style={animated ? { opacity: 0 } : undefined} />
        )}
      </g>
      <circle
        ref={dotRef}
        cx={MARK_DOT.cx}
        cy={MARK_DOT.cy}
        r={sw * 1.1}
        fill={accent}
        style={animated ? { opacity: 0 } : undefined}
      />
    </svg>
  );
}

export default ZenomMark;
