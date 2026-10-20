"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "@/components/motion/LenisProvider";
import { NAV_LINKS } from "./nav-links";

const LINKS = [{ href: "/", label: "Home" }, ...NAV_LINKS, { href: "/account", label: "Account" }];

// Full-screen menu overlay under 900px (44px italic serif links). Scroll is
// paused while it is open.
export function MobileNav({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  useScrollLock(open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[850] flex flex-col justify-center gap-2 bg-[rgba(18,16,14,0.96)] px-8 py-10 backdrop-blur-[10px] min-[900px]:hidden"
        >
          {LINKS.map((l, i) => (
            <motion.div
              key={l.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={l.href}
                onClick={onNavigate}
                className="block border-b border-ink/10 py-2.5 font-display text-[44px] italic leading-tight text-ink"
              >
                {l.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
