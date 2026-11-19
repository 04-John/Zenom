"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { art, CATALOG_BY_CODE } from "@/lib/catalog";
import { motionClock } from "@/lib/motion";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";
import { GALLERY_ALL } from "@/components/storefront-mobile/routes";

/** One hero image; featured artworks also carry their title and page. */
export type HeroSlide = { key: string; src: string; alt: string; title?: string; href?: string };

// Shown when no artwork is marked "Show on home page" (or they can't be loaded).
const SLIDES: HeroSlide[] = ["w05", "w07", "w08", "w09"].map((code) => {
  const title = CATALOG_BY_CODE[code]?.title;
  return { key: code, src: art(code), alt: title ? `${title}, a charcoal portrait by Samuel` : "Charcoal portrait by Samuel" };
});
const SLIDE_MS = 4200;
const EASE = "cubic-bezier(.16,1,.3,1)";

// Below 900px the image only loads on phones; on desktop the hidden copy asks for a 1px candidate.
const SIZES = "(max-width: 899.98px) 100vw, 1px";

// Full-bleed hero (reference: Prototype "home"): the artworks marked "Show on
// home page" in the studio (else four of Samuel's portraits) crossfade (1.6s)
// with a slow zoom (zKen, 7s); tick bars show progress (zTick, one per
// slide) beside a link to the artwork on screen. One headline, one solid
// CTA, one text link. The copy rises in once the splash has wiped away
// (motionClock.heroStart). Reduced motion: the first slide, still, with
// every tick drawn.
export function MobileHero({ slides: featured }: { slides?: HeroSlide[] }) {
  const slides = featured && featured.length > 0 ? featured : SLIDES;
  const count = slides.length;
  const reduced = useReducedMotionSafe();
  const [slide, setSlide] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [wait, setWait] = useState(0); // seconds until the splash has gone

  useEffect(() => {
    setWait(Math.max(0, motionClock.heroStart - performance.now()) / 1000);
  }, []);

  useEffect(() => {
    if (reduced || count < 2) {
      setSlide(0);
      return;
    }
    let interval = 0;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setSlide((s) => (s + 1) % count);
        setCycle((c) => c + 1);
      }, SLIDE_MS);
    }, wait * 1000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [reduced, wait, count]);

  const current = slides[Math.min(slide, count - 1)];

  // Only the very first slide waits for the splash.
  const lead = cycle === 0 ? wait : 0;
  const rise = (d: number) => ({ animationDelay: `${(d + wait).toFixed(2)}s` });

  return (
    <section aria-label="Zenom Studio" className="relative h-[100svh] min-h-[560px] overflow-hidden">
      {slides.map((s, i) => {
        const on = i === slide;
        return (
          <div
            key={s.key}
            aria-hidden={!on}
            className="absolute inset-0"
            style={{ opacity: on ? 1 : 0, transition: "opacity 1.6s ease" }}
          >
            <div className="absolute inset-0" style={on && !reduced ? { animation: `zKen 7s ease-out ${lead}s both` } : undefined}>
              <Image
                src={s.src}
                alt={s.alt}
                fill
                priority={i === 0}
                sizes={SIZES}
                className="object-cover"
                style={{ objectPosition: "50% 28%" }}
              />
            </div>
          </div>
        );
      })}

      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(18,16,14,.6) 0%, rgba(18,16,14,0) 20%, rgba(18,16,14,0) 40%, rgba(18,16,14,.9) 70%, #12100E 100%)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[18px] px-6 pb-11" style={{ paddingBottom: "calc(44px + env(safe-area-inset-bottom))" }}>
        <div className="flex min-h-[20px] items-center justify-between gap-4">
          <div aria-hidden className="flex gap-1.5">
            {count > 1 &&
              slides.map((s, i) => (
                <span
                  key={s.key}
                  className="block h-[2px] overflow-hidden bg-ink/25"
                  style={{ width: i === slide ? 28 : 12, transition: `width .6s ${EASE}` }}
                >
                  <span
                    className="block h-full origin-left bg-ink"
                    style={
                      reduced || i < slide
                        ? { transform: "scaleX(1)" }
                        : i === slide
                          ? { animation: `zTick ${SLIDE_MS}ms linear ${lead}s both`, transform: "scaleX(1)" }
                          : { transform: "scaleX(0)" }
                    }
                    key={i === slide ? `tick-${cycle}` : "idle"}
                  />
                </span>
              ))}
          </div>
          {/* The artwork on screen: one link that keeps focus while the title inside changes. */}
          {current.href && current.title && (
            <Link href={current.href} className="zf zk -my-3 flex min-w-0 max-w-[65%] items-center gap-2 py-3 text-ink-2 hover:text-ink">
              <span key={current.key} className="truncate" style={reduced ? undefined : { animation: "zRise .6s cubic-bezier(.16,1,.3,1) both" }}>
                {current.title}
              </span>
              <span aria-hidden className="text-ember">
                →
              </span>
            </Link>
          )}
        </div>
        <p className="zk zr text-ink-2" style={rise(0.25)}>
          Zenom Studio — Kaduna
        </p>
        <h1 className="zs zr text-[40px] leading-none text-ink" style={rise(0.35)}>
          More than
          <br />a portrait.
        </h1>
        <p className="zr max-w-[290px] text-[14px] leading-[1.6] text-ink-2" style={rise(0.45)}>
          Charcoal, pencil and colour-pencil work, drawn by hand by Samuel.
        </p>
        <div className="zr flex flex-col gap-1" style={rise(0.55)}>
          <Link
            href={GALLERY_ALL}
            className="zf flex h-[54px] items-center justify-center rounded-pill bg-ink text-[15px] font-semibold text-night hover:bg-ember hover:text-night"
          >
            Explore the work
          </Link>
          <Link href="/commission" className="zf flex h-[46px] items-center justify-center gap-2 rounded-pill text-[14px] text-ink hover:text-ink">
            Start a commission <span aria-hidden className="text-ember">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
