"use client";

import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import Lenis from "lenis";

type LenisContextValue = {
  lenis: React.MutableRefObject<Lenis | null>;
  /** Pauses smooth scrolling (modal / menu open). Returns an unlock function. */
  lock: () => () => void;
};

const LenisContext = createContext<LenisContextValue | null>(null);

// Smooth scroll (lerp ≈ 0.12) that framer-motion's useScroll reads from,
// since Lenis drives the real window scroll position. Disabled for
// prefers-reduced-motion. Locks are reference-counted so a menu and a modal
// can both be open without one re-enabling scroll under the other.
export function LenisProvider({ children }: { children: ReactNode }) {
  const lenis = useRef<Lenis | null>(null);
  const locks = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({ lerp: 0.12, smoothWheel: true });
    lenis.current = instance;
    if (locks.current > 0) instance.stop();

    let raf = 0;
    const tick = (time: number) => {
      instance.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  const lock = () => {
    locks.current += 1;
    lenis.current?.stop();
    // Without Lenis (reduced motion) fall back to plain overflow lock.
    if (!lenis.current) document.documentElement.style.overflow = "hidden";
    let released = false;
    return () => {
      if (released) return;
      released = true;
      locks.current = Math.max(0, locks.current - 1);
      if (locks.current === 0) {
        lenis.current?.start();
        document.documentElement.style.overflow = "";
      }
    };
  };

  return <LenisContext.Provider value={{ lenis, lock }}>{children}</LenisContext.Provider>;
}

export function useLenis() {
  const ctx = useContext(LenisContext);
  if (!ctx) throw new Error("useLenis must be used within LenisProvider");
  return ctx;
}

/** Locks scrolling while `active` is true (modal or full-screen menu open). */
export function useScrollLock(active: boolean) {
  const { lock } = useLenis();
  useEffect(() => {
    if (!active) return;
    return lock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
