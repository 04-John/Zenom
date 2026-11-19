"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { easeOutCubic, motionClock } from "@/lib/motion";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { DrawnMark } from "@/components/storefront-mobile/DrawnMark";

const DRAW_MS = 2400;   // one-stroke draw of the mark
const HOLD_MS = 650;    // wordmark settles
const WIPE_MS = 1000;

// Below 900px (reference: Splash / Prototype "splash"): the mark draws in
// 1.5s, the counter runs 0→100 (+4 every 60ms), and at 2.6s the screen
// wipes up (0.95s) to reveal home.
const M_STEP_MS = 60;
const M_WIPE_AT = 2600;
const M_WIPE_MS = 950;

const WIPE_EASE = "cubic-bezier(.76,0,.24,1)";

// Shown once per session (sessionStorage "zenom.intro"). The Unbroken Line mark
// draws itself (ember pencil tip leads the line), "Zenom Studio" fades in, then
// the overlay wipes up. The inline <head> script in layout.tsx sets
// html[data-intro-seen] before paint so returning visits never flash it.
// Both layouts are in the markup (CSS picks one); the timeline that runs is
// chosen once, from the viewport width at load.
export function IntroLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"desktop" | "mobile" | null>(null);
  const [named, setNamed] = useState(false);
  const [count, setCount] = useState(0);
  const timerRef = useRef<number>();
  const wipeRef = useRef<Animation>();

  useEffect(() => () => {
    window.clearTimeout(timerRef.current);
    wipeRef.current?.cancel();
  }, []);

  const wipe = useCallback((duration: number) => {
    const root = rootRef.current;
    if (!root) return;
    const anim = root.animate(
      [{ clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)" }],
      { duration, easing: WIPE_EASE, fill: "forwards" }
    );
    wipeRef.current = anim;
    anim.onfinish = () => { root.style.display = "none"; };
    try { sessionStorage.setItem("zenom.intro", "1"); } catch { /* ignore */ }
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
    const t0 = performance.now();
    if (window.innerWidth < 900) {
      // The home hero rises in as the wipe uncovers it.
      motionClock.heroStart = t0 + M_WIPE_AT + 150;
      motionClock.pageStart = t0 + M_WIPE_AT + 150;
      motionClock.revealSlot = t0 + M_WIPE_AT + 300;
      setMode("mobile");
      return;
    }
    // Reveals, the hero entrance and page intros wait for the loader.
    const end = DRAW_MS / 0.6 * 0.66 + HOLD_MS;
    motionClock.heroStart = t0 + end + 300;
    motionClock.pageStart = t0 + end + 300;
    motionClock.revealSlot = t0 + end + 500;
    setMode("desktop");
  }, []);

  // Mobile timeline: counter, then the wipe.
  useEffect(() => {
    if (mode !== "mobile") return;
    let c = 0;
    const tick = window.setInterval(() => {
      c = Math.min(100, c + 4);
      setCount(c);
      if (c >= 100) window.clearInterval(tick);
    }, M_STEP_MS);
    const wipeAt = window.setTimeout(() => wipe(M_WIPE_MS), M_WIPE_AT);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(wipeAt);
    };
  }, [mode, wipe]);

  const onDrawn = useCallback(() => {
    if (!rootRef.current) return;
    setNamed(true);
    timerRef.current = window.setTimeout(() => wipe(WIPE_MS), HOLD_MS);
  }, [wipe]);

  return (
    <div
      ref={rootRef}
      data-intro-loader
      aria-hidden
      className="fixed inset-0 z-[1400] flex flex-col items-center justify-center gap-7 bg-night-deep"
      style={{ background: "radial-gradient(ellipse at 50% 42%, #231D18, #0C0B09 70%)" }}
    >
      {/* From 900px: the original intro (display: contents keeps its flex layout). */}
      <div className="contents max-[900px]:hidden">
        <div className="h-[200px] w-[200px] sm:h-[300px] sm:w-[300px]">
          {mode === "desktop" && (
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

      {/* Below 900px: the mobile splash. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[22px] bg-night-deep min-[900px]:hidden">
        <div
          className="absolute h-[340px] w-[340px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(229,138,82,.18) 0%, rgba(229,138,82,0) 70%)",
            animation: "zGlow 2.4s ease-in-out infinite",
          }}
        />
        <div className="relative">
          <DrawnMark size={104} stroke={12} play={mode === "mobile"} drawMs={1500} delayMs={200} popMs={1900} label="" />
        </div>
        <p className="zk relative text-ink-3" style={mode === "mobile" ? { animation: "zRise .9s cubic-bezier(.16,1,.3,1) .5s both" } : { opacity: 0 }}>
          Zenom Studio
        </p>
        <div
          className="absolute inset-x-7 flex items-baseline justify-between"
          style={{ bottom: "calc(44px + env(safe-area-inset-bottom))" }}
        >
          <span className="zk text-ink-3">More than a portrait</span>
          <span className="zn text-[30px] leading-none text-ink">{count}</span>
        </div>
      </div>
    </div>
  );
}

// keep the export used by the old counter in case anything imported it
export { easeOutCubic };
