"use client";

import { useEffect, useState } from "react";
import { useLocalState } from "@/components/mobile/ui";
import { SIZE_INCHES } from "@/lib/zenom-mobile";

/** True below 900px (the light app's breakpoint). False on the server and first paint. */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899.98px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

/** prefers-reduced-motion, for JS-driven motion (slideshow timer, confetti). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* ── Display preferences (Settings). Stored on this device only; no backend field yet. ── */

export type Prefs = {
  currency: "NGN" | "USD";
  unit: "in" | "cm";
  email: boolean;
  whatsapp: boolean;
  newwork: boolean;
};

export const DEFAULT_PREFS: Prefs = { currency: "NGN", unit: "in", email: true, whatsapp: false, newwork: true };

export function usePrefs() {
  const [prefs, setPrefs, ready] = useLocalState<Prefs>("zs.prefs", DEFAULT_PREFS);
  return { prefs: { ...DEFAULT_PREFS, ...prefs }, setPrefs, ready };
}

/** "16×20 in" or "41×51 cm" */
export function sizeText(sizeIndex: number, unit: "in" | "cm", withUnit = true): string {
  const [w, h] = SIZE_INCHES[sizeIndex];
  const s = unit === "cm" ? `${Math.round(w * 2.54)}×${Math.round(h * 2.54)}` : `${w}×${h}`;
  return withUnit ? `${s} ${unit}` : s;
}
