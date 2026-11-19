"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ArtCard } from "@/lib/artworks";
import { ABSTRACT_CATEGORIES, formatNaira, type Category } from "@/lib/pricing";

export type MobileFilter = "all" | "portrait" | "abstract" | Exclude<Category, "portrait">;

const CHIPS: { key: MobileFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "portrait", label: "Portraits" },
  { key: "abstract", label: "Abstract" },
  { key: "geometric", label: "Geometric" },
  { key: "minimalistic", label: "Minimalistic" },
  { key: "figurative", label: "Figurative" },
];

const KEYS = CHIPS.map((c) => c.key) as string[];
const EASE = "cubic-bezier(.16,1,.3,1)";

const matches = (key: MobileFilter, c: Category) =>
  key === "all" || (key === "abstract" ? ABSTRACT_CATEGORIES.includes(c) : c === key);

/** `?style=` → filter; each route has its own default (Portraits / Abstract). */
export function parseMobileFilter(value: string | null | undefined, page: "portraits" | "abstract"): MobileFilter {
  if (value && KEYS.includes(value)) return value as MobileFilter;
  return page === "portraits" ? "portrait" : "abstract";
}

// "The work." below 900px (reference: Gallery / Prototype "gallery"): one
// scrollable row of filter chips with live counts, then a 2-column grid of
// 4:5 cards. Filtering is client-side over every published artwork; on each
// change the cards rise in again (alternating zRiseA / zRiseB, 60ms apart).
// The choice is mirrored into ?style= so Back returns to the same filter.
export function MobileGallery({ works, page }: { works: ArtCard[]; page: "portraits" | "abstract" }) {
  const params = useSearchParams();
  const styleParam = params.get("style");
  const [filter, setFilter] = useState<MobileFilter>(() => parseMobileFilter(styleParam, page));
  const [gen, setGen] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  // Follow ?style= when it changes from outside (e.g. a menu link to the same
  // route with another query). Our own replaceState lands on the same value.
  useEffect(() => {
    const next = parseMobileFilter(styleParam, page);
    if (next === filterRef.current) return;
    setFilter(next);
    setGen((g) => g + 1);
  }, [styleParam, page]);

  const counts = useMemo(() => {
    const out = {} as Record<MobileFilter, number>;
    CHIPS.forEach(({ key }) => (out[key] = works.filter((w) => matches(key, w.category)).length));
    return out;
  }, [works]);

  const shown = works.filter((w) => matches(filter, w.category));

  // Bring the opening chip into view (e.g. Figurative sits off-screen right).
  useEffect(() => {
    const row = rowRef.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (row && chip) row.scrollLeft = Math.max(0, chip.offsetLeft - 24);
  }, []);

  const pick = (key: MobileFilter) => {
    if (key === filter) return;
    setFilter(key);
    setGen((g) => g + 1);
    try {
      const url = new URL(window.location.href);
      if (key === parseMobileFilter(null, page)) url.searchParams.delete("style");
      else url.searchParams.set("style", key);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      /* URL sync is cosmetic */
    }
  };

  const rise = gen % 2 ? "zRiseB" : "zRiseA";

  return (
    <div className="pb-12" style={{ paddingTop: "calc(56px + env(safe-area-inset-top))" }}>
      <div className="flex flex-col gap-2 px-6 pb-[18px] pt-3">
        <p className="zk zr text-ink-3" aria-live="polite">
          {shown.length} {shown.length === 1 ? "work" : "works"}
        </p>
        <h1 className="zs zr text-[34px] leading-none text-ink" style={{ animationDelay: ".08s" }}>
          The work.
        </h1>
      </div>

      <div ref={rowRef} role="group" aria-label="Filter works" className="zsc flex gap-2 overflow-x-auto px-6 pb-5">
        {CHIPS.map((c) => {
          const on = c.key === filter;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => pick(c.key)}
              className={`zb zf flex h-11 flex-none items-center gap-1.5 whitespace-nowrap rounded-pill border px-4 text-[13px] font-medium transition-colors duration-300 ${
                on ? "border-ink bg-ink text-night" : "border-ink/[0.16] text-ink-2"
              }`}
            >
              {c.label}
              <span className={on ? "text-night/60" : "text-ink-3"}>{counts[c.key]}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <p className="text-[14px] text-ink-2">Nothing in this room yet.</p>
          <button
            type="button"
            onClick={() => pick("all")}
            className="zb zf h-12 rounded-pill border border-ink/20 px-[22px] text-[14px] text-ink"
          >
            See all the work
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 px-6 pt-2">
          {shown.map((a, k) => (
            <li key={a.id} style={{ animation: `${rise} .8s ${EASE} ${(0.1 + Math.min(k, 9) * 0.06).toFixed(2)}s both` }}>
              <Link href={a.href} className="zf group flex flex-col gap-2.5 rounded-[14px] text-ink hover:text-ink">
                <span className="relative block aspect-[4/5] overflow-hidden rounded-[14px] bg-night-raised">
                  <Image
                    src={a.imageUrl}
                    alt={a.name}
                    fill
                    priority={k < 4}
                    sizes="(max-width: 899.98px) 46vw, 1px"
                    className="object-cover transition-transform duration-500 group-active:scale-[0.98]"
                  />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium leading-snug">{a.name}</span>
                  <span className="text-[12px] text-ink-3">
                    from {formatNaira(a.from)}
                    {!a.available && <span className="text-ember"> · Unavailable</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
