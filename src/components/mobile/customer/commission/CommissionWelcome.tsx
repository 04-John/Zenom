"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { art } from "@/lib/catalog";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { Cta } from "@/components/mobile/ui";
import { useReducedMotion } from "../hooks";

/** Welcome: 3-slide crossfade + zoom (4.5s), quote blurs in, dots, ember CTA, "Track an order". */
export function CommissionWelcome({ totalWorks, onStart }: { totalWorks: number; onStart: () => void }) {
  const [slide, setSlide] = useState(0);
  const reduced = useReducedMotion();

  const slides = [
    { img: art("w05"), tag: "Hand-drawn in Kaduna", headline: "More than a portrait.", body: "Commissioned charcoal and pencil work, drawn by hand by Samuel." },
    { img: art("g01"), tag: "Four rooms, one studio", headline: `Start from ${totalWorks} works, or your own photo.`, body: "Portraits, geometric, minimalistic and figurative pieces in six sizes." },
    { img: art("w07"), tag: "From blank sheet to your wall", headline: "One price, agreed before anything starts.", body: "Confirmed on WhatsApp, framed and delivered to your door." },
  ];

  // Auto-advance, unless the visitor prefers reduced motion.
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setSlide((s) => (s + 1) % 3), 4500);
    return () => window.clearInterval(id);
  }, [reduced]);

  const s = slides[slide];

  return (
    <section
      className="intro-in"
      aria-label="Welcome"
      style={{ position: "relative", minHeight: "100dvh", background: "#12100E", color: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}
    >
      {slides.map((x, i) => (
        <Image key={x.img} src={x.img} alt="" fill priority={i === 0} sizes="(max-width: 560px) 100vw, 560px" className={"bg" + (i === slide ? " on" : "")} style={{ objectFit: "cover" }} />
      ))}
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(18,16,14,.55) 0%, rgba(18,16,14,0) 28%, rgba(18,16,14,.3) 48%, rgba(18,16,14,.94) 100%)" }}
      />
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(var(--m-top) + 12px) 20px 0" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, color: "#ffffff", textDecoration: "none", minHeight: 44 }} aria-label="Zenom Studio home">
          <ZenomMark size={30} ink="#ffffff" title="" />
          <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 24 }}>Zenom</span>
        </Link>
        <Link
          href="/account/orders"
          style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,.16)", color: "#ffffff", font: "600 14px 'Instrument Sans', sans-serif", height: 44, padding: "0 16px", borderRadius: 999, textDecoration: "none", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        >
          Track an order
        </Link>
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 22, padding: "0 20px calc(28px + var(--m-bottom))" }}>
        <div style={{ minHeight: 170, display: "flex", alignItems: "flex-end" }}>
          <div key={slide} className="quote" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="kick" style={{ color: "#E58A52" }}>
              {s.tag}
            </span>
            <h1 style={{ margin: 0, fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: 34, lineHeight: 1.05 }}>{s.headline}</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#DCD5CA" }}>{s.body}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }} aria-hidden="true">
          {slides.map((x, i) => (
            <span key={x.img} className={"dot" + (i === slide ? " on" : "")} />
          ))}
        </div>
        <Cta tone="ember" arrow onClick={onStart}>
          Start a commission
        </Cta>
        <p style={{ margin: 0, fontSize: 12, color: "#C9C1B5", textAlign: "center" }}>
          By continuing, you agree to our{" "}
          <Link href="/terms" style={{ color: "#ffffff", textDecoration: "underline" }}>
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" style={{ color: "#ffffff", textDecoration: "underline" }}>
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
