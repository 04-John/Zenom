"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { motionClock } from "@/lib/motion";
import type { ArtCard } from "@/lib/artworks";
import type { Category } from "@/lib/pricing";

export type GalleryFilter = {
  key: string;
  label: string;
  count: number;
  /** Categories this filter shows; omit for "everything in `products`". */
  categories?: Category[];
  /** Filters that live on another route render as links. */
  href?: string;
  /** Pill is the page's own collection, active even though it isn't a client filter. */
  active?: boolean;
};

export type GalleryInfo = { blurb: string };

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const pill = "shrink-0 whitespace-nowrap rounded-pill border border-ink/[0.16] px-[18px] py-2.5 text-[13px] font-medium backdrop-blur-[10px] transition-colors";

// Sticky filter pills + masonry. Filtering is client-side: the grid fades down
// (240ms), then the new cards "toss" in (+-40px x, 70px y, +-7deg, 55ms apart).
export function ProductGrid({
  products,
  filters,
  info,
  initialFilter,
  queryParam = "style",
}: {
  products: ArtCard[];
  filters: GalleryFilter[];
  info: Record<string, GalleryInfo>;
  initialFilter: string;
  queryParam?: string;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const gridRef = useRef<HTMLDivElement>(null);
  const fadeOut = useRef<Animation | null>(null);

  const current = filters.find((f) => f.key === filter);
  const visible = current?.categories ? products.filter((p) => current.categories!.includes(p.category)) : products;

  // Entrance for every card on mount and after each filter change: in-view
  // cards toss in immediately (staggered), the rest when they scroll in.
  useIsoLayoutEffect(() => {
    const grid = gridRef.current;
    fadeOut.current?.cancel();
    fadeOut.current = null;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-card]"));
    if (typeof grid.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((c) => c.classList.remove("rv-hidden"));
      return;
    }
    const anims = new Map<Element, Animation>();
    cards.forEach((el) => {
      const rr = Math.random() * 2 - 1;
      const a = el.animate(
        [
          { opacity: 0, transform: `translate(${rr * 40}px,70px) rotate(${rr * 7}deg)` },
          { opacity: 1, transform: "translate(0px,0px) rotate(0deg)" },
        ],
        { duration: 1000, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" }
      );
      a.pause();
      a.currentTime = 0;
      el.classList.remove("rv-hidden");
      anims.set(el, a);
    });

    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const a = anims.get(e.target);
          if (!a) return;
          const now = performance.now();
          const start = Math.max(now, motionClock.revealSlot);
          motionClock.revealSlot = start + 55;
          timers.push(
            setTimeout(() => {
              a.onfinish = () => a.cancel();
              a.play();
            }, start - now)
          );
        });
      },
      { rootMargin: "0px 0px -4% 0px" }
    );
    cards.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
      anims.forEach((a) => a.cancel());
    };
  }, [filter]);

  const select = useCallback(
    (key: string) => {
      if (key === filter) return;
      const commit = () => {
        setFilter(key);
        try {
          const url = new URL(window.location.href);
          if (key === filters[0].key) url.searchParams.delete(queryParam);
          else url.searchParams.set(queryParam, key);
          window.history.replaceState(window.history.state, "", url);
        } catch {
          /* URL sync is cosmetic */
        }
      };
      const grid = gridRef.current;
      if (!grid || typeof grid.animate !== "function" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        commit();
        return;
      }
      fadeOut.current?.cancel();
      const a = grid.animate(
        [
          { opacity: 1, transform: "translateY(0px)" },
          { opacity: 0, transform: "translateY(24px)" },
        ],
        { duration: 240, easing: "ease-in", fill: "forwards" }
      );
      fadeOut.current = a;
      a.onfinish = commit;
    },
    [filter, filters, queryParam]
  );

  return (
    <div className="relative z-[2] mx-auto max-w-[1360px] px-6 pb-[120px] pt-5">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div />
        <p className="m-0 max-w-[380px] text-[14px] leading-[1.7] text-ink-2">{info[filter]?.blurb}</p>
      </div>

      <div
        role="tablist"
        aria-label="Filter works"
        className="sticky top-[84px] z-20 -mx-6 mb-10 flex gap-1.5 overflow-x-auto px-6 py-2 [scrollbar-width:none] min-[640px]:mx-0 min-[640px]:flex-wrap min-[640px]:overflow-visible min-[640px]:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {filters.map((f) => {
          const on = f.href ? !!f.active : f.key === filter;
          const cls = `${pill} ${on ? "bg-ink text-night hover:text-night" : "bg-night/60 text-ink hover:bg-ink/[0.08]"}`;
          const inner = (
            <>
              {f.label}
              <span className="ml-2 font-mono text-[10px] opacity-60">{f.count}</span>
            </>
          );
          return f.href ? (
            <Link key={f.key} href={f.href} className={cls} aria-current={on ? "page" : undefined}>
              {inner}
            </Link>
          ) : (
            <button key={f.key} role="tab" aria-selected={on} onClick={() => select(f.key)} className={cls}>
              {inner}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="This collection is taking a little pause."
          action={
            <Link href="/abstract" className="text-ember underline">
              Explore another collection
            </Link>
          }
        />
      ) : (
        <div ref={gridRef} className="[column-gap:24px] [columns:4_260px]">
          {visible.map((a, i) => (
            <ProductCard key={a.slug} art={a} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
