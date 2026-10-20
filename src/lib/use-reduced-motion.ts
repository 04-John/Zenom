"use client";

import { useEffect, useState } from "react";

/**
 * prefers-reduced-motion, hydration-safe: false on the server and for the
 * first client render, then the real value. Pinned scenes use it to render
 * their final state instead of animating.
 */
export function useReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
