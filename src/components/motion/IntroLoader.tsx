"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { easeOutCubic, motionClock } from "@/lib/motion";
import { ZenomMark } from "@/components/brand/ZenomMark";

const DRAW_MS = 2400;   // one-stroke draw of the mark
const HOLD_MS = 650;    // wordmark settles
const WIPE_MS = 1000;

// Shown once per session (sessionStorage "zenom.intro"). The Unbroken Line mark
// draws itself (ember pencil tip leads the line), "Zenom Studio" fades in, then
// the overlay wipes up. The inline <head> script in layout.tsx sets
// html[data-intro-seen] before paint so returning visits never flash it.
export function IntroLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [named, setNamed] = useState(false);
  const timerRef = useRef<number>();
  const wipeRef = useRef<Animation>();

  useEffect(() => () => {
    window.clearTimeout(timerRef.current);
    wipeRef.current?.cancel();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let seen = false;
    try { seen = sessionStorage.getItem("zenom.intro") === "1"; } catch { /* show intro */ }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced || typeof root.animate !== "function") {
      root.style.display = "none";
      return;
    }
    // Reveals, the hero entrance and page intros wait for the loader.
    const t0 = performance.now(), end = DRAW_MS / 0.6 * 0.66 + HOLD_MS;
    motionClock.heroStart = t0 + end + 300;
    motionClock.pageStart = t0 + end + 300;
    motionClock.revealSlot = t0 + end + 500;
    setActive(true);
  }, []);

  const onDrawn = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    setNamed(true);
    timerRef.current = window.setTimeout(() => {
      const wipe = root.animate(
        [{ clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)" }],
        { duration: WIPE_MS, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" }
      );
      wipeRef.current = wipe;
      wipe.onfinish = () => { root.style.display = "none"; };
      try { sessionStorage.setItem("zenom.intro", "1"); } catch { /* ignore */ }
    }, HOLD_MS);
  }, []);

  return (
    <div
      ref={rootRef}
      data-intro-loader
      aria-hidden
      className="fixed inset-0 z-[1400] flex flex-col items-center justify-center gap-7 bg-night-deep"
      style={{ background: "radial-gradient(ellipse at 50% 42%, #231D18, #0C0B09 70%)" }}
    >
      <div className="h-[200px] w-[200px] sm:h-[300px] sm:w-[300px]">
        {active && (
          <ZenomMark size={300} draw="once" duration={DRAW_MS} onDrawn={onDrawn} className="!h-full !w-full" />
        )}
      </div>
      <div
        className="text-center transition-[opacity,transform] duration-700 ease-editorial-out"
        style={{ opacity: named ? 1 : 0, transform: named ? "none" : "translateY(12px)" }}
      >
        <div className="font-display text-[44px] italic leading-none text-ink">Zenom Studio</div>
        <div className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">More than a portrait</div>
      </div>
    </div>
  );
}

// keep the export used by the old counter in case anything imported it
export { easeOutCubic };
