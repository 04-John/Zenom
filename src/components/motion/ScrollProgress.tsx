"use client";

import { motion, useScroll } from "framer-motion";

// 2px ember bar fixed to the top: scaleX(scrollY / maxScroll).
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[1160] h-[2px] w-full origin-left bg-ember"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
