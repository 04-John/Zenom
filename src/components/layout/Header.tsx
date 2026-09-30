"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, UserRound, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { MobileNav } from "./MobileNav";

const ABSTRACT_LIVE = process.env.NEXT_PUBLIC_ABSTRACT_LIVE === "true";
const SPACES_LIVE = process.env.NEXT_PUBLIC_SPACES_LIVE === "true";

// Header begins transparent over the hero and transitions to a solid
// navy background after scrolling — subtle, not jarring.
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        className="fixed top-0 z-50 w-full transition-colors duration-300"
        style={{
          backgroundColor: scrolled ? "#0E1A2B" : "transparent",
        }}
      >
        <div className="mx-auto flex max-w-container items-center justify-between px-6 py-5 lg:px-10">
          <Link href="/" className="font-display text-xl tracking-widest text-ivory">
            ZENOM STUDIO
          </Link>

          <nav className="hidden items-center gap-10 lg:flex">
            <Link href="/portraits" className="text-sm tracking-wide text-ivory hover:text-copper">
              Portraits
            </Link>
            <NavLink href="/abstract" label="Abstract" live={ABSTRACT_LIVE} />
            <NavLink href="/spaces" label="Spaces" live={SPACES_LIVE} />
          </nav>

          <div className="flex items-center gap-5">
            <Link href="/account" aria-label="Account" className="text-ivory hover:text-copper">
              <UserRound size={20} />
            </Link>
            <Link href="/cart" aria-label="Order bag" className="relative text-ivory hover:text-copper">
              <ShoppingBag size={20} />
              {items.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-copper text-[10px] text-ivory">
                  {items.length}
                </span>
              )}
            </Link>
            <button
              aria-label="Menu"
              className="text-ivory lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </motion.header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function NavLink({ href, label, live }: { href: string; label: string; live: boolean }) {
  if (!live) {
    return (
      <span className="cursor-not-allowed text-sm tracking-wide text-ivory/40">
        {label} <span className="text-[10px] uppercase text-copper/70">· Soon</span>
      </span>
    );
  }
  return (
    <Link href={href} className="text-sm tracking-wide text-ivory hover:text-copper">
      {label}
    </Link>
  );
}
