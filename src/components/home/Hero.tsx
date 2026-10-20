"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ZenomMark } from "@/components/brand/ZenomMark";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { buttonClass } from "@/components/ui/Button";
import { art } from "@/lib/catalog";
import { clamp01, motionClock } from "@/lib/motion";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion";
import { WA_LINK } from "./shared";

// Samuel's portraits only (w01–w11), five repeated to fill the 16-tile arch.
const TILE_IDS = ["w01", "w02", "w03", "w04", "w05", "w06", "w07", "w08", "w09", "w10", "w11", "w02", "w05", "w07", "w08", "w04"];
const N = TILE_IDS.length;

export function Hero() {
  const reduced = useReducedMotionSafe();
  const [narrow, setNarrow] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [markGo, setMarkGo] = useState(false);

  // The mark draws itself once the intro loader has finished (heroStart is
  // read here, lazily, not at module load).
  useEffect(() => {
    const t = window.setTimeout(() => setMarkGo(true), Math.max(0, motionClock.heroStart - performance.now()) + 200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const arch = archRef.current;
    if (!section || !arch) return;

    // Viewport is measured on resize only, never per frame.
    let vw = window.innerWidth;
    let vh = Math.max(window.innerHeight, 640);
    let ang = 0;
    let last = performance.now();
    let raf = 0;

    const draw = (now: number) => {
      const sy = window.scrollY;
      const intro = reduced ? 1 : 1 - Math.pow(1 - clamp01((now - motionClock.heroStart) / 2200), 3);
      const R = Math.min(vw * 0.46, vh * 0.72, 660) * (0.7 + 0.3 * intro);
      const lift = reduced ? 0 : Math.min(1, sy / (vh * 0.75));
      arch.style.transform = `translateY(${-sy * (reduced ? 0 : 0.45) + (1 - intro) * 120}px)`;
      arch.style.filter = lift > 0.01 || intro < 1 ? `blur(${lift * 12 + (1 - intro) * 14}px)` : "none";
      arch.style.opacity = String((1 - lift * 0.85) * intro);
      for (let i = 0; i < N; i++) {
        const el = tileRefs.current[i];
        if (!el) continue;
        const th = ang + (i * 2 * Math.PI) / N;
        const s = Math.sin(th);
        const c = Math.cos(th);
        const vis = clamp01((s - 0.02) / 0.42);
        const rot = -c * 30 + (reduced ? 0 : Math.sin(th * 2 + now / 3000) * 5);
        const sc = 0.7 + 0.38 * Math.max(0, s);
        el.style.transform = `translate(-50%,-50%) translate(${c * R}px,${-s * R * 0.94}px) rotate(${rot}deg) scale(${sc})`;
        el.style.opacity = String(vis);
        el.style.filter = vis < 0.98 ? `blur(${(1 - vis) * 9}px)` : "none";
        el.style.zIndex = String(100 + Math.round(s * 100));
      }
    };

    const onResize = () => {
      vw = window.innerWidth;
      vh = Math.max(window.innerHeight, 640);
      setNarrow(vw < 900);
      if (reduced) draw(performance.now());
    };
    onResize();

    if (reduced) {
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ang += dt * 0.055;
      draw(now);
    };
    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    // Pause the loop once the hero is far off-screen.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: "100px 0px" });
    io.observe(section);
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      stop();
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  const tw = narrow ? 96 : 150;
  const th = narrow ? 120 : 186;

  return (
    <section ref={sectionRef} className="relative z-[2] h-screen min-h-[640px] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span
          aria-hidden
          className="whitespace-nowrap font-display italic text-ink/[0.025]"
          style={{ fontSize: "min(30vw,420px)", transform: "translateY(-6%)" }}
        >
          Samuel
        </span>
      </div>
      <div
        aria-hidden
        className="absolute left-[22px] top-1/2 mt-[120px] hidden origin-left -rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 min-[900px]:block"
        style={{ transform: "translateY(-50%) rotate(-90deg)" }}
      >
        ART FOR PEOPLE, ART FOR SPACES
      </div>

      <div ref={archRef} className="absolute left-1/2 top-[86%] h-0 w-0 will-change-[transform,filter]" aria-hidden>
        {TILE_IDS.map((id, i) => (
          <div
            key={i}
            ref={(el) => {
              tileRefs.current[i] = el;
            }}
            className="absolute left-0 top-0 overflow-hidden opacity-0 will-change-[transform,opacity]"
            style={{ width: tw, height: th, borderRadius: 22, boxShadow: "0 20px 50px rgba(0,0,0,0.55)" }}
          >
            <Image src={art(id)} alt="" fill sizes="200px" className="object-cover" />
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[300] h-[34%]"
        style={{ background: "linear-gradient(to bottom,rgba(18,16,14,0),#12100E 78%)" }}
      />

      <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center px-6 text-center" style={{ transform: "translateY(4vh)" }}>
        <Reveal variant="pop">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2"
              style={{ background: "radial-gradient(circle, rgba(229,138,82,0.32) 0%, rgba(229,138,82,0.10) 45%, rgba(229,138,82,0) 70%)" }}
            />
            {markGo && <ZenomMark size={64} draw="once" duration={2200} />}
          </div>
        </Reveal>
        <Reveal variant="up" className="mt-[22px] font-mono text-[11px] uppercase tracking-[0.28em] text-ink-2">
          ZENOM STUDIO — KADUNA
        </Reveal>
        <Reveal variant="mask" as="h1" className="h-hero mt-[14px] text-ink">
          More than
          <br />
          a portrait.
        </Reveal>
        <Reveal variant="up" as="p" className="mt-[22px] max-w-[420px] text-[15px] leading-[1.6] text-ink-2 [text-wrap:pretty]">
          Commissioned charcoal, pencil and colour-pencil work, drawn by hand by Samuel.
        </Reveal>
        <Reveal variant="up" className="mt-7 flex flex-wrap justify-center gap-[10px]">
          <Link href="/portraits" className={buttonClass("primary", "!min-h-0 px-6 py-[14px]")}>
            Explore the work
          </Link>
          <a href={WA_LINK} target="_blank" rel="noreferrer" className={buttonClass("secondary", "!min-h-0 px-6 py-[14px] font-medium")}>
            Start a commission
          </a>
        </Reveal>
      </div>

      <div className="absolute bottom-[26px] left-1/2 z-[400] -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">
        SCROLL TO BEGIN
      </div>
    </section>
  );
}
