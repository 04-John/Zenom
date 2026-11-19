"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { BAG_BUTTON_ID } from "@/components/cart/AddToBagFly";
import { ZenomNavLogo } from "@/components/brand/ZenomLockup";
import { MobileBar } from "@/components/storefront-mobile/MobileBar";
import { MobileNav } from "./MobileNav";
import { NAV_LINKS } from "./nav-links";

// From 900px: floating blurred pill, fixed 18px from the top.
// Below 900px: the mobile storefront bar (logo or back, Bag, menu) and the
// full-screen menu overlay. The menu closes once the route has changed, so a
// menu link fades straight into the next page.
export function Header() {
  const pathname = usePathname();
  const { items } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[18px] z-[900] flex justify-center px-4 max-[900px]:hidden">
        <nav
          aria-label="Main"
          className="pointer-events-auto flex items-center gap-1.5 rounded-pill border border-ink/10 bg-[rgba(24,21,18,0.72)] py-1.5 pl-2 pr-1.5 shadow-nav backdrop-blur-[18px]"
        >
          <Link href="/" className="flex items-center py-0.5 pr-3 text-ink hover:text-ink">
            <ZenomNavLogo />
          </Link>

          <div className="hidden items-center gap-0.5 min-[900px]:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 rounded-pill px-3.5 py-[9px] text-[13px] font-medium text-ink transition-colors hover:bg-ink/[0.08] hover:text-ink ${
                  isActive(l.href) ? "bg-ink/10" : ""
                }`}
              >
                {l.label}
                {l.soon && <span className="font-mono text-[9px] tracking-[0.1em] text-ember">SOON</span>}
              </Link>
            ))}
          </div>

          <div className="ml-1.5 flex gap-1">
            <Link
              href="/account"
              className="hidden rounded-pill border border-ink/15 px-4 py-[9px] text-[13px] text-ink transition-colors hover:border-ink/40 hover:text-ink min-[900px]:block"
            >
              Account
            </Link>
            <Link
              id={BAG_BUTTON_ID}
              href="/cart"
              className="flex items-center gap-2 rounded-pill bg-ink px-4 py-[9px] text-[13px] font-semibold text-night transition-colors hover:bg-ember hover:text-night"
            >
              Bag
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-pill bg-night px-1.5 text-[11px] font-medium text-ink">
                {items.length}
              </span>
            </Link>
            <button
              type="button"
              aria-expanded={menuOpen}
              onClick={toggleMenu}
              className="rounded-pill border border-ink/15 px-4 py-[9px] text-[13px] text-ink min-[900px]:hidden"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </nav>
      </div>

      <MobileBar menuOpen={menuOpen} onMenu={toggleMenu} />
      <MobileNav open={menuOpen} onClose={closeMenu} />
    </>
  );
}
