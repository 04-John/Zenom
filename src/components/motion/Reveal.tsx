"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

// Standard scroll-triggered entrance: opacity 0->1, translateY 20px->0.
// Respects prefers-reduced-motion via Framer's built-in hook — reduced
// motion collapses this to an instant, essential-feedback-only state.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
