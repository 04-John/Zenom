"use client";

import { createContext, useCallback, useContext, useEffect, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLenis } from "@/components/motion/LenisProvider";
import { motionClock } from "@/lib/motion";

// The "travel" transition: the page shrinks to a card and slides away, a
// route map shows the journey from the current stop to the next, and the new
// page arrives from the direction of travel (out 850ms, in 1000ms).
// Link clicks are intercepted globally, so every <Link> gets it for free;
// programmatic navigation can use useTransitionNavigate().

const STOP_LABELS = ["Home", "Portraits", "Abstract", "Artwork", "Pricing", "Bag", "Checkout", "Contact", "Account", "Spaces"];

function stopFor(path: string): number | null {
  if (path === "/") return 0;
  if (path === "/portraits") return 1;
  if (path === "/abstract") return 2;
  if (/^\/(portraits|abstract)\/[^/]+$/.test(path)) return 3;
  if (path === "/pricing") return 4;
  if (path === "/cart") return 5;
  if (path === "/checkout") return 6;
  if (path === "/contact") return 7;
  if (path === "/account" || path.startsWith("/account/") || path === "/login" || path === "/signup") return 8;
  if (path === "/spaces") return 9;
  return null;
}

const D_OUT = 850;
const D_IN = 1000;
const EASE = "cubic-bezier(.65,0,.35,1)";

type NavFn = (href: string, label?: string) => void;
const TransitionContext = createContext<NavFn | null>(null);

export function useTransitionNavigate(): NavFn {
  const nav = useContext(TransitionContext);
  const router = useRouter();
  return nav ?? ((href) => router.push(href));
}

export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { lenis, lock } = useLenis();

  const mainRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLSpanElement>(null);
  const toRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const busy = useRef(false);
  const pathRef = useRef(pathname);
  const arrived = useRef<(() => void) | null>(null);

  // Resolves the pending "wait for the new route" promise once the pathname changes.
  useEffect(() => {
    pathRef.current = pathname;
    arrived.current?.();
  }, [pathname]);

  const waitForRoute = (href: string) =>
    new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 8000); // never strand the user off-screen
      arrived.current = () => {
        clearTimeout(timeout);
        arrived.current = null;
        resolve();
      };
      router.push(href);
    });

  const resetScroll = useCallback(() => {
    if (lenis.current) lenis.current.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [lenis]);

  const navigate: NavFn = useCallback(
    async (href, label) => {
      if (busy.current) return;
      const url = new URL(href, window.location.href);
      const from = stopFor(pathRef.current);
      const to = stopFor(url.pathname);
      const m = mainRef.current;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Same page (query/hash only) or same stop: no travel.
      const sameStop = from !== null && from === to && from !== 3;
      if (!m || typeof m.animate !== "function" || sameStop || url.pathname === pathRef.current) {
        router.push(href);
        return;
      }

      busy.current = true;
      const unlock = lock();

      const finish = () => {
        m.style.overflow = "";
        m.style.transformOrigin = "";
        delete document.documentElement.dataset.traveling;
        unlock();
        busy.current = false;
      };

      // Reduced motion, or a page outside the route map: simple fade.
      if (reduced || from === null || to === null) {
        const out = m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" });
        await out.finished.catch(() => {});
        await waitForRoute(href);
        resetScroll();
        motionClock.revealSlot = performance.now() + (reduced ? 0 : 300);
        const inn = m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 150 : 350 });
        out.cancel();
        await inn.finished.catch(() => {});
        finish();
        return;
      }

      const dir = to >= from ? 1 : -1;
      const wh = window.innerHeight;
      const stopPos = (i: number) => `${(i / (STOP_LABELS.length - 1)) * 100}%`;

      if (fromRef.current) fromRef.current.textContent = `FROM ${STOP_LABELS[from].toUpperCase()}`;
      if (toRef.current) toRef.current.textContent = label || STOP_LABELS[to];

      const mapDuration = D_OUT + D_IN;
      mapRef.current?.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }],
        { duration: mapDuration + 60, easing: "linear" }
      );
      dotRef.current?.animate(
        [{ left: stopPos(from) }, { left: stopPos(from), offset: 0.25 }, { left: stopPos(to), offset: 0.75 }, { left: stopPos(to) }],
        { duration: mapDuration, easing: EASE, fill: "both" }
      );
      const lo = Math.min(from, to);
      const span = `${(Math.abs(to - from) / (STOP_LABELS.length - 1)) * 100}%`;
      fillRef.current?.animate(
        [
          { left: stopPos(from), width: "0%" },
          { left: stopPos(from), width: "0%", offset: 0.25 },
          { left: stopPos(lo), width: span, offset: 0.75 },
          { left: stopPos(lo), width: span },
        ],
        { duration: mapDuration, easing: EASE, fill: "both" }
      );

      document.documentElement.dataset.traveling = "1";
      m.style.transformOrigin = `50% ${window.scrollY + wh / 2}px`;
      m.style.overflow = "clip";
      const card = { borderRadius: "28px", boxShadow: "0 0 0 1px rgba(239,233,223,0.12), 0 50px 140px rgba(0,0,0,0.7)" };
      const flat = { borderRadius: "0px", boxShadow: "0 0 0 0px rgba(239,233,223,0), 0 0 0 rgba(0,0,0,0)" };

      const out = m.animate(
        [
          { transform: "translateX(0vw) scale(1)", ...flat },
          { transform: "translateX(0vw) scale(0.8)", ...card, offset: 0.45 },
          { transform: `translateX(${-dir * 118}vw) scale(0.8)`, ...card },
        ],
        { duration: D_OUT, easing: EASE, fill: "forwards" }
      );
      await out.finished.catch(() => {});

      await waitForRoute(href);
      resetScroll();
      const now = performance.now();
      motionClock.revealSlot = now + 500;
      motionClock.pageStart = now + 350;
      motionClock.heroStart = now + 300;
      m.style.transformOrigin = `50% ${wh / 2}px`;
      await new Promise((r) => requestAnimationFrame(r));

      const inn = m.animate(
        [
          { transform: `translateX(${dir * 118}vw) scale(0.8)`, ...card },
          { transform: "translateX(0vw) scale(0.8)", ...card, offset: 0.55 },
          { transform: "translateX(0vw) scale(1)", ...flat },
        ],
        { duration: D_IN, easing: EASE, fill: "forwards" }
      );
      out.cancel();
      await inn.finished.catch(() => {});
      inn.cancel();
      finish();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, lock, resetScroll]
  );

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Intercept internal link clicks (capture phase, before next/link's handler,
  // which skips defaultPrevented events).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? (e.target.closest("a[href]") as HTMLAnchorElement | null) : null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (/^\/(api|monitoring|_next)\b/.test(url.pathname)) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      const label = a.closest("[data-transition-label]")?.getAttribute("data-transition-label") ?? undefined;
      navigateRef.current(url.pathname + url.search + url.hash, label);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <TransitionContext.Provider value={navigate}>
      <main ref={mainRef} className="relative">
        {children}
      </main>

      {/* Route-map overlay shown while travelling. */}
      <div ref={mapRef} aria-hidden className="pointer-events-none fixed inset-0 z-[1200] opacity-0">
        <div className="absolute inset-x-0 top-[2.2vh] flex items-baseline justify-center gap-3.5 text-ink">
          <span ref={fromRef} className="font-mono text-[10px] tracking-[0.24em] text-ink-3" />
          <span className="text-ember">→</span>
          <span ref={toRef} className="font-display italic" style={{ fontSize: "clamp(22px,3.6vh,34px)" }} />
        </div>
        <div className="absolute inset-x-[8vw] bottom-[2.6vh] h-[26px]">
          <div className="absolute inset-x-0 top-[6px] h-px bg-ink/20" />
          <div ref={fillRef} className="absolute left-0 top-[6px] h-px w-0 bg-ember" />
          {STOP_LABELS.map((label, i) => (
            <div
              key={label}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1.5"
              style={{ left: `${(i / (STOP_LABELS.length - 1)) * 100}%` }}
            >
              <span className="mt-[3px] h-[7px] w-[7px] rounded-full border border-ink/40 bg-[#2A2520]" />
              <span className="whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.16em] text-ink-3">{label}</span>
            </div>
          ))}
          <div
            ref={dotRef}
            className="absolute left-0 top-0 -ml-[6.5px] h-[13px] w-[13px] rounded-full bg-ember"
            style={{ boxShadow: "0 0 18px 5px rgba(229,138,82,0.6)" }}
          />
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
