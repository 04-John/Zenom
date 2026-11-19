"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useScrollLock } from "@/components/motion/LenisProvider";
import { CloseIcon } from "@/components/storefront-mobile/icons";
import { WHATSAPP_NUMBER } from "@/lib/pricing";
import { CONTACT_EMAIL } from "@/lib/site";
import { NAV_LINKS } from "./nav-links";

const EASE = [0.16, 1, 0.3, 1] as const;

const SOCIAL = [
  { href: `https://wa.me/${WHATSAPP_NUMBER}`, label: "WhatsApp", external: true },
  { href: "https://instagram.com/zenom.studio", label: "Instagram", external: true },
  { href: `mailto:${CONTACT_EMAIL}`, label: "Email", external: false },
];

// Full-screen menu below 900px (reference: Menu / Prototype "menu"). Fades in
// with a slight scale (zFadeIn); the links rise one by one, 60ms apart.
// Menu links fade into the next page (data-nav="fade"); the overlay closes
// when the route changes (Header), so the fade happens underneath it.
// Scroll is locked while open; Escape closes; focus moves in and back.
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  useScrollLock(open);
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  // A link to the page we are already on does not change the route, so close here.
  const closeIfCurrent = (href: string) => {
    if (href.split("?")[0] === pathname) onClose();
  };

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: reduce ? { duration: 0 } : { duration: 0.9, delay: 0.12 + i * 0.06, ease: EASE },
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          data-lenis-prevent
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1, transition: reduce ? { duration: 0 } : { duration: 0.6, ease: EASE } }}
          exit={{ opacity: 0, transition: reduce ? { duration: 0 } : { duration: 0.5, ease: "easeOut" } }}
          className="fixed inset-0 z-[960] flex flex-col overflow-y-auto bg-night-deep text-ink min-[900px]:hidden"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex h-14 flex-none items-center justify-between pl-2 pr-3">
            <Link
              href="/"
              data-nav="fade"
              onClick={() => closeIfCurrent("/")}
              className="zf zs flex h-11 items-center rounded-pill px-3 text-[23px] leading-none text-ink hover:text-ink"
            >
              Zenom
            </Link>
            <button
              ref={closeRef}
              type="button"
              aria-label="Close menu"
              onClick={onClose}
              className="zb zf flex h-11 w-11 items-center justify-center rounded-full text-ink"
            >
              <CloseIcon />
            </button>
          </div>

          <nav aria-label="Site" className="flex flex-1 flex-col gap-1 px-6 pt-9">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((l, i) => (
                <motion.li key={l.href} {...rise(i)}>
                  <Link
                    href={l.href}
                    data-nav="fade"
                    onClick={() => closeIfCurrent(l.href)}
                    className={`zf zs flex min-h-[44px] items-baseline gap-2.5 rounded-md text-[38px] leading-[1.3] ${
                      l.soon ? "text-ink-3 hover:text-ink-2" : "text-ink"
                    }`}
                  >
                    {l.label}
                    {l.soon && <span className="zk text-[9px] not-italic text-ember">Soon</span>}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-none flex-col gap-5 px-6 pb-11 pt-6">
            <motion.div {...rise(NAV_LINKS.length + 1)}>
              <Link
                href="/account/orders"
                onClick={() => closeIfCurrent("/account/orders")}
                className="zf flex h-[52px] items-center justify-center rounded-pill border border-ink/20 text-[15px] font-medium text-ink hover:border-ink/50 hover:text-ink"
              >
                My account &amp; orders
              </Link>
            </motion.div>
            <motion.div {...rise(NAV_LINKS.length + 2)} className="zk flex justify-between tracking-[0.18em]">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  {...(s.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="zf flex min-h-[44px] items-center rounded-md text-ink-2 hover:text-ink"
                >
                  {s.label}
                </a>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
