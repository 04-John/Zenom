"use client";

import { createContext, useCallback, useContext, useEffect, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLenis } from "@/components/motion/LenisProvider";
import { motionClock } from "@/lib/motion";
import { isLightRoute } from "@/lib/light-routes";
import { MOBILE_MAX, storefrontDepth } from "@/components/storefront-mobile/routes";

// From 900px — the "travel" transition: the page shrinks to a card and slides
// away, a route map shows the journey from the current stop to the next, and
// the new page arrives from the direction of travel (out 850ms, in 1000ms).
//
// Below 900px — the mobile storefront's push / pop (handoff "A. Dark
// storefront"): the outgoing page is snapshotted into a fixed overlay (a
// clone of <main>), the route changes underneath, then both move together
// for 0.6s cubic-bezier(.16,1,.3,1). Going deeper (by storefrontDepth) the
// new page slides in from the right while the old one drifts to -30% and
// dims to 0.35; going back is the reverse; same depth, or a link marked
// data-nav="fade" (the menu), fades with a slight scale. Browser back /
// forward (popstate) animate the same way. Between two light-app routes
// nothing happens (the light app animates itself); between a light and a
// dark route it is a plain fade. Reduced motion: a quick fade at most.
//
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

// Mobile push / pop.
const M_DUR = 600;
const M_EASE = "cubic-bezier(.16,1,.3,1)";
const Z_SNAPSHOT = 850; // under the mobile bar (880) and menu / sheets (960)

type MobileKind = "push" | "pop" | "fade";
/** `data-nav` on a link: "back" = the mobile Back button, "fade" = menu links. */
type NavHint = "back" | "fade";
type NavFn = (href: string, label?: string, hint?: NavHint) => void;
const TransitionContext = createContext<NavFn | null>(null);

export function useTransitionNavigate(): NavFn {
  const nav = useContext(TransitionContext);
  const router = useRouter();
  return nav ?? ((href) => router.push(href));
}

const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function depthKind(from: string, to: string): MobileKind | null {
  const a = storefrontDepth(from);
  const b = storefrontDepth(to);
  if (a === null || b === null) return null;
  return b > a ? "push" : b < a ? "pop" : "fade";
}

/**
 * Blocks scroll input for the length of a mobile transition. Lenis' lock()
 * would set overflow:hidden on <html>, which makes <body> (overflow-x:
 * hidden) the scroll container and unsticks the pinned bottom bars.
 */
function freezeScroll() {
  const block = (e: Event) => e.preventDefault();
  const keys = (e: KeyboardEvent) => {
    if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) e.preventDefault();
  };
  window.addEventListener("touchmove", block, { passive: false });
  window.addEventListener("wheel", block, { passive: false });
  window.addEventListener("keydown", keys);
  return () => {
    window.removeEventListener("touchmove", block);
    window.removeEventListener("wheel", block);
    window.removeEventListener("keydown", keys);
  };
}

/** Fixed, inert copy of <main> at the current scroll offset. */
function snapshot(main: HTMLElement, scrollY: number): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.className = "zclone";
  overlay.setAttribute("aria-hidden", "true");
  overlay.setAttribute("inert", "");
  Object.assign(overlay.style, {
    position: "fixed",
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
    zIndex: String(Z_SNAPSHOT),
    overflow: "hidden",
    background: "#12100E",
    pointerEvents: "none",
    willChange: "transform, opacity",
  });
  // <main> plus the footer after it, so the copy lines up at any scroll offset.
  const footers = Array.from(document.querySelectorAll("footer")).filter(
    (f) => !main.contains(f) && main.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING
  );
  for (const el of [main, ...footers]) {
    const copy = el.cloneNode(true) as HTMLElement;
    copy.removeAttribute("id");
    copy.querySelectorAll("[id]").forEach((c) => c.removeAttribute("id"));
    overlay.appendChild(copy);
  }
  document.body.appendChild(overlay);
  overlay.scrollTop = scrollY;
  return overlay;
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

  // In-app history (pathnames + scroll offsets), so the mobile Back button can
  // use history.back() and a pop can return to where the reader was.
  const hist = useRef<{ entries: { path: string; y: number }[]; idx: number }>({ entries: [], idx: -1 });
  const popping = useRef(false);
  const lastY = useRef(0);
  const edgeTouch = useRef(-Infinity);

  // Resolves the pending "wait for the new route" promise once the pathname
  // changes, and records new history entries.
  useEffect(() => {
    pathRef.current = pathname;
    const h = hist.current;
    if (popping.current) popping.current = false;
    else if (h.entries[h.idx]?.path !== pathname) {
      h.entries = h.entries.slice(0, h.idx + 1);
      h.entries.push({ path: pathname, y: 0 });
      h.idx = h.entries.length - 1;
    }
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

  /** Waits for a route change someone else started (popstate). */
  const waitForArrival = () =>
    new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        arrived.current = null;
        resolve();
      }, 8000);
      arrived.current = () => {
        clearTimeout(timeout);
        arrived.current = null;
        resolve();
      };
    });

  const resetScroll = useCallback(() => {
    if (lenis.current) lenis.current.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  }, [lenis]);

  const scrollToY = useCallback(
    (y: number) => {
      if (lenis.current) lenis.current.scrollTo(y, { immediate: true, force: true });
      window.scrollTo(0, y);
    },
    [lenis]
  );

  /** Mobile: snapshot the old page, change route, then move both. */
  const runMobile = async (kind: MobileKind, scrollY: number, go: () => Promise<void>, settle: () => void) => {
    const m = mainRef.current;
    if (!m || typeof m.animate !== "function") {
      await go();
      settle();
      return;
    }
    busy.current = true;
    const unlock = freezeScroll();
    const overlay = snapshot(m, scrollY);
    const s = m.style;
    try {
      await go();
      settle();
      motionClock.revealSlot = performance.now() + 250;
      await new Promise((r) => requestAnimationFrame(r));

      s.position = "relative";
      s.zIndex = String(kind === "pop" ? Z_SNAPSHOT - 1 : Z_SNAPSHOT + 1);
      s.minHeight = "100vh";
      s.willChange = "transform, opacity";
      s.transformOrigin = `50% ${window.scrollY + window.innerHeight / 2}px`;
      if (!isLightRoute(pathRef.current)) s.background = "#12100E";

      const timing = { duration: M_DUR, easing: M_EASE };
      const hold = { ...timing, fill: "forwards" as const };
      let inn: Animation;
      let out: Animation;
      if (kind === "push") {
        inn = m.animate([{ transform: "translateX(100%)" }, { transform: "none" }], timing);
        out = overlay.animate([{ transform: "none", opacity: 1 }, { transform: "translateX(-30%)", opacity: 0.35 }], hold);
      } else if (kind === "pop") {
        inn = m.animate([{ transform: "translateX(-30%)", opacity: 0.35 }, { transform: "none", opacity: 1 }], timing);
        out = overlay.animate([{ transform: "none" }, { transform: "translateX(100%)" }], hold);
      } else {
        inn = m.animate([{ opacity: 0, transform: "scale(1.04)" }, { opacity: 1, transform: "none" }], timing);
        out = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: "ease", fill: "forwards" });
      }
      await Promise.all([inn.finished, out.finished]).catch(() => {});
    } finally {
      overlay.remove();
      s.position = s.zIndex = s.minHeight = s.willChange = s.transformOrigin = s.background = "";
      unlock();
      busy.current = false;
    }
  };

  /** Mobile, light ↔ dark or reduced motion: the plain fade. */
  const fadeMobile = async (href: string) => {
    const m = mainRef.current;
    if (!m || typeof m.animate !== "function") {
      router.push(href);
      return;
    }
    busy.current = true;
    const unlock = freezeScroll();
    const reduced = prefersReduced();
    try {
      const out = m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 120 : 200, fill: "forwards" });
      await out.finished.catch(() => {});
      await waitForRoute(href);
      resetScroll();
      motionClock.revealSlot = performance.now() + (reduced ? 0 : 300);
      const inn = m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 150 : 350 });
      out.cancel();
      await inn.finished.catch(() => {});
    } finally {
      unlock();
      busy.current = false;
    }
  };

  const navigateMobile = async (href: string, hint?: NavHint) => {
    const url = new URL(href, window.location.href);
    const from = pathRef.current;
    const to = url.pathname;
    const fromLight = isLightRoute(from);
    const toLight = isLightRoute(to);
    if (!mainRef.current || to === from || (fromLight && toLight)) {
      router.push(href);
      return;
    }
    // Remember where we were, for a later pop back to this page.
    const h = hist.current;
    if (h.entries[h.idx]) h.entries[h.idx].y = window.scrollY;

    if (fromLight || toLight || prefersReduced()) {
      await fadeMobile(href);
      return;
    }
    const kind: MobileKind = hint === "fade" ? "fade" : hint === "back" ? "pop" : depthKind(from, to) ?? "fade";
    await runMobile(kind, window.scrollY, () => waitForRoute(href), resetScroll);
  };

  const navigate: NavFn = useCallback(
    async (href, label, hint) => {
      if (busy.current) return;
      if (window.innerWidth < MOBILE_MAX) {
        await navigateMobile(href, hint);
        return;
      }
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
  const runMobileRef = useRef(runMobile);
  runMobileRef.current = runMobile;
  const waitForArrivalRef = useRef(waitForArrival);
  waitForArrivalRef.current = waitForArrival;

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
      const navAttr = a.closest("[data-nav]")?.getAttribute("data-nav");
      const hint: NavHint | undefined = navAttr === "back" || navAttr === "fade" ? navAttr : undefined;
      // Mobile Back: step back through real history when the previous page is ours.
      if (hint === "back" && window.innerWidth < MOBILE_MAX && hist.current.idx > 0 && !busy.current) {
        e.preventDefault();
        window.history.back();
        return;
      }
      e.preventDefault();
      const label = a.closest("[data-transition-label]")?.getAttribute("data-transition-label") ?? undefined;
      navigateRef.current(url.pathname + url.search + url.hash, label, hint);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Mobile: browser back / forward animate as pop / push. Scroll offsets are
  // tracked continuously so the snapshot shows the page as it was, even if
  // the browser restores scroll before popstate fires.
  useEffect(() => {
    const onScroll = () => {
      lastY.current = window.scrollY;
    };
    // iOS edge-swipe back already animates; don't animate a second time.
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || (t.clientX > 24 && t.clientX < window.innerWidth - 24)) return;
      if (e.target instanceof Element && e.target.closest("a,button,input,textarea,select")) return;
      edgeTouch.current = performance.now();
    };
    const onPop = () => {
      const to = window.location.pathname;
      const from = pathRef.current;
      if (to === from) return;

      const h = hist.current;
      if (h.entries[h.idx]) h.entries[h.idx].y = lastY.current;
      let dir: "back" | "forward" | null = null;
      if (h.idx > 0 && h.entries[h.idx - 1].path === to) {
        h.idx -= 1;
        dir = "back";
      } else if (h.entries[h.idx + 1]?.path === to) {
        h.idx += 1;
        dir = "forward";
      } else {
        h.entries = [{ path: to, y: 0 }];
        h.idx = 0;
      }
      popping.current = true;
      const restoreY = h.entries[h.idx].y;

      if (window.innerWidth >= MOBILE_MAX || busy.current) return;
      if (performance.now() - edgeTouch.current < 1500) return;
      const fromLight = isLightRoute(from);
      const toLight = isLightRoute(to);
      if ((fromLight && toLight) || prefersReduced() || !mainRef.current) return;

      const kind: MobileKind =
        fromLight || toLight ? "fade" : dir === "forward" ? "push" : dir === "back" ? "pop" : depthKind(from, to) ?? "pop";
      void runMobileRef.current(kind, lastY.current, () => waitForArrivalRef.current(), () => scrollToY(restoreY));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("popstate", onPop);
    };
  }, [scrollToY]);

  return (
    <TransitionContext.Provider value={navigate}>
      <main ref={mainRef} className="relative">
        {children}
      </main>

      {/* Route-map overlay shown while travelling (900px and up). */}
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
