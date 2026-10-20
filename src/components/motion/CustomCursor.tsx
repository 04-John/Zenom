"use client";

import { useEffect, useRef } from "react";

// Ring cursor (pointer: fine only). 36px ring that lerps toward the pointer;
// 54px filled ring over links/buttons; 86px ember disc with a mono label over
// anything with [data-cursor="LABEL"]; a 10px dot over text inputs.
// All state lives in DOM styles updated from one rAF loop — no React renders
// on mouse move.
export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!ring || !label) return;

    document.documentElement.classList.add("has-custom-cursor");

    let mx = -100;
    let my = -100;
    let cx = -100;
    let cy = -100;
    let hovered: Element | null = null;
    let last = performance.now();
    let raf = 0;

    const set = (size: number, bg: string, border: string) => {
      ring.style.width = ring.style.height = `${size}px`;
      ring.style.margin = `-${size / 2}px 0 0 -${size / 2}px`;
      ring.style.background = bg;
      ring.style.borderColor = border;
    };

    const hover = (target: EventTarget | null) => {
      const el = target instanceof Element ? target.closest("[data-cursor],a,button,input,textarea,select") : null;
      if (el === hovered) return;
      hovered = el;
      const text = el?.getAttribute("data-cursor");
      if (text) {
        set(86, "#E58A52", "transparent");
        label.textContent = text.toUpperCase();
        label.style.opacity = "1";
      } else if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) {
        set(10, "#EFE9DF", "transparent");
        label.style.opacity = "0";
      } else if (el) {
        set(54, "rgba(239,233,223,0.08)", "rgba(239,233,223,0.9)");
        label.style.opacity = "0";
      } else {
        set(36, "transparent", "rgba(239,233,223,0.6)");
        label.style.opacity = "0";
      }
    };

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      ring.style.opacity = "1";
      hover(e.target);
    };
    const onLeave = () => {
      ring.style.opacity = "0";
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = Math.min(1, dt * 14);
      cx += (mx - cx) * k;
      cy += (my - cy) * k;
      ring.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <div
      ref={ringRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[1300] flex items-center justify-center rounded-full border opacity-0"
      style={{
        width: 36,
        height: 36,
        margin: "-18px 0 0 -18px",
        borderColor: "rgba(239,233,223,0.6)",
        transition:
          "width .35s cubic-bezier(.2,.7,.2,1), height .35s cubic-bezier(.2,.7,.2,1), margin .35s cubic-bezier(.2,.7,.2,1), background .3s, border-color .3s, opacity .2s",
      }}
    >
      <span
        ref={labelRef}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-night opacity-0 transition-opacity duration-200"
      />
    </div>
  );
}
