"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { ChevronLeftIcon, MenuIcon } from "./icons";
import { isArtworkPath, isBagPath, parentRoute } from "./routes";

const EASE = "cubic-bezier(.16,1,.3,1)";

// The dark storefront's top bar below 900px (hidden from 900px up, where the
// floating pill nav is used). Per the reference screens:
//   home      → mark + "Zenom", Bag (n), menu
//   artwork   → back, Bag (n)
//   bag       → back, "BAG · n"
//   elsewhere → back, Bag (n), menu
// It is fixed, transparent at the top of the page and gets a blurred night
// backing once content scrolls under it (on home: once the hero is passed).
// Back is a real link to the parent route; PageTransition turns it into a
// history.back() (animated as a pop) when there is in-app history.
export function MobileBar({ menuOpen, onMenu }: { menuOpen: boolean; onMenu: () => void }) {
  const pathname = usePathname() ?? "/";
  const { items, hydrated } = useCart();
  const n = items.length;
  const home = pathname === "/";
  const bag = isBagPath(pathname);
  const artwork = isArtworkPath(pathname);

  const [solid, setSolid] = useState(false);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const limit = home ? Math.max(8, window.innerHeight - 140) : 8;
      setSolid(window.scrollY > limit);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [home]);

  // The count pops (and turns ember) whenever a piece is added.
  const prev = useRef<number | null>(null);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    if (!hydrated) return;
    if (prev.current !== null && n > prev.current) setBump((b) => b + 1);
    prev.current = n;
  }, [n, hydrated]);

  const pieces = `${n} ${n === 1 ? "piece" : "pieces"}`;

  return (
    <div className="fixed inset-x-0 top-0 z-[880] min-[900px]:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div
        aria-hidden
        className="absolute inset-0 border-b"
        style={{
          background: solid ? "rgba(18,16,14,.86)" : "rgba(18,16,14,0)",
          borderColor: solid ? "rgba(239,233,223,.08)" : "transparent",
          backdropFilter: solid ? "blur(14px)" : "none",
          WebkitBackdropFilter: solid ? "blur(14px)" : "none",
          transition: "background-color .3s ease, border-color .3s ease",
        }}
      />
      <nav aria-label="Main" className="relative flex h-14 items-center justify-between pl-2 pr-3">
        {home ? (
          <Link href="/" aria-label="Zenom Studio, home" className="zf flex h-11 items-center gap-2 rounded-pill pl-3 pr-2 text-ink hover:text-ink">
            <span aria-hidden className="block">
              <ZenomMark size={24} title="" />
            </span>
            <span className="zs text-[23px] leading-none">Zenom</span>
          </Link>
        ) : (
          <Link
            href={parentRoute(pathname)}
            data-nav="back"
            aria-label="Back"
            className="zf flex h-11 w-11 items-center justify-center rounded-full text-ink hover:text-ink"
          >
            <ChevronLeftIcon />
          </Link>
        )}

        {bag && (
          <span className="zk pointer-events-none absolute left-1/2 -translate-x-1/2 text-ink-3" aria-live="polite">
            Bag · {n}
          </span>
        )}

        <div className="flex items-center">
          {!bag && (
            <Link
              href="/cart"
              aria-label={`Bag, ${pieces}`}
              className="zf flex h-11 items-center rounded-pill px-2.5 text-[14px] font-medium text-ink hover:text-ink"
            >
              Bag (
              <span
                className="inline-block"
                style={bump ? { animation: `${bump % 2 ? "zBumpA" : "zBumpB"} .6s ${EASE} both`, color: "#E58A52" } : undefined}
              >
                {n}
              </span>
              )
            </Link>
          )}
          {bag ? (
            <span aria-hidden className="w-11" />
          ) : (
            !artwork && (
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                onClick={onMenu}
                className="zb zf flex h-11 w-11 items-center justify-center rounded-full text-ink"
              >
                <MenuIcon />
              </button>
            )
          )}
        </div>
      </nav>
    </div>
  );
}
