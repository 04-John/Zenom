// Small pure helpers shared by the scroll scenes (ported from the design
// reference's logic class). Nothing here touches the DOM.

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/** Linear interpolation of two "#rrggbb" colours → "rgb(r,g,b)". */
export function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = parse(a);
  const y = parse(b);
  return "rgb(" + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",") + ")";
}

/** Easing curves used across the site (framer-motion wants number tuples). */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_TRAVEL = [0.65, 0, 0.35, 1] as const;
export const EASE_WIPE = [0.76, 0, 0.24, 1] as const;

/**
 * Module-level clock shared by the intro loader, page transitions, the hero
 * and scroll reveals. All values are `performance.now()` timestamps.
 */
export const motionClock = {
  /** Reveals queue 70ms apart; nothing reveals before this time. */
  revealSlot: 0,
  /** Home hero entrance starts at this time. */
  heroStart: 0,
  /** Inner-page intro entrance starts at this time. */
  pageStart: 0,
};
