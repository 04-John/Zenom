"use client";

import { useEffect, ReactNode } from "react";
import Lenis from "lenis";

// Smooth scroll foundation — the near-universal pattern under every
// award-winning site referenced in the UX benchmark. Native scroll is
// replaced with fluid, controlled motion that Framer Motion's
// scroll-tied animations sync against.
export function LenisProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}
