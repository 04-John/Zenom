"use client";

import { useEffect, useState } from "react";

// Fixed left (desktop only). The active chapter is the [data-chapter="i"]
// section crossing the viewport's middle line: ember text, and its line grows
// from 16px to 40px. Fades out when no chapter is under the middle line.
export function ChapterTracker({ chapters }: { chapters: string[] }) {
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    if (!els.length) return;
    const live = new Set<number>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const i = Number((e.target as HTMLElement).dataset.chapter);
          if (e.isIntersecting) live.add(i);
          else live.delete(i);
        });
        setActive(live.size ? Math.max(...live) : -1);
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-6 top-1/2 z-[700] hidden -translate-y-1/2 flex-col gap-3.5 transition-opacity duration-500 min-[900px]:flex"
      style={{ opacity: active >= 0 ? 1 : 0 }}
    >
      {chapters.map((label, i) => (
        <div
          key={label}
          className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-[400ms]"
          style={{ color: i === active ? "#E58A52" : "#8F877C" }}
        >
          <span
            className={`block h-px bg-current transition-[width] duration-500 ease-editorial-out ${
              i === active ? "w-6 min-[1500px]:w-10" : "w-4"
            }`}
          />
          {/* Below 1500px only the number shows, so the tracker never sits on the chapter copy. */}
          <span>{label.split(" ")[0]}</span>
          <span className="hidden min-[1500px]:inline">{label.split(" ").slice(1).join(" ")}</span>
        </div>
      ))}
    </div>
  );
}
