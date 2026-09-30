"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const ABSTRACT_LIVE = process.env.NEXT_PUBLIC_ABSTRACT_LIVE === "true";
const SPACES_LIVE = process.env.NEXT_PUBLIC_SPACES_LIVE === "true";

// Full-screen mobile nav — never a cramped dropdown.
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col bg-navy px-8 py-8"
        >
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="self-end text-ivory min-h-[44px] min-w-[44px]"
          >
            <X size={26} />
          </button>
          <nav className="mt-12 flex flex-1 flex-col gap-8">
            <Link href="/portraits" onClick={onClose} className="font-display text-3xl text-ivory">
              Portraits
            </Link>
            <span className="font-display text-3xl text-ivory/40">
              Abstract {!ABSTRACT_LIVE && <span className="text-sm text-copper align-middle"> Soon</span>}
            </span>
            <span className="font-display text-3xl text-ivory/40">
              Spaces {!SPACES_LIVE && <span className="text-sm text-copper align-middle"> Soon</span>}
            </span>
            <Link href="/account" onClick={onClose} className="mt-auto text-ivory/70">
              My Account
            </Link>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
