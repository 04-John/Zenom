"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Navigation must NEVER wait on an exit animation — Next.js routing
// begins immediately; this only animates the entrance of the new page's
// content. No blocking, no page-transition-as-loading-mechanism.
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
