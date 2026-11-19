"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Cta } from "./controls";

/**
 * 6-dot stage tracker (customer + studio order detail). `current` is 1-based.
 * Dots before `current` are filled ember with a check; the current dot pulses;
 * `complete` fills every dot.
 */
export function StageTracker({
  current,
  total = 6,
  complete,
  caption,
}: {
  current: number;
  total?: number;
  complete?: boolean;
  /** e.g. ["Stage 3 of 6", "Deposit due"] */
  caption?: [ReactNode, ReactNode];
}) {
  const dots = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center" }} role="img" aria-label={`Stage ${current} of ${total}`}>
        {dots.map((i) => {
          const done = complete || i < current;
          const now = !complete && i === current;
          return (
            <span key={i} style={{ display: "flex", alignItems: "center", flex: i < total ? 1 : "none" }}>
              <span
                className={"stage-fill" + (now ? " pulse" : "")}
                style={{
                  width: 22,
                  height: 22,
                  flex: "none",
                  boxSizing: "border-box",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done ? "#E58A52" : "#ffffff",
                  border: done ? "2px solid #E58A52" : now ? "6px solid #E58A52" : "2px solid #CFC8BD",
                }}
              >
                {done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
              {i < total && <span className="stage-fill" style={{ flex: 1, height: 2, background: done ? "#E58A52" : "#E8E2D8" }} />}
            </span>
          );
        })}
      </div>
      {caption && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: "#4A433B" }}>{caption[0]}</span>
          <strong>{caption[1]}</strong>
        </div>
      )}
    </div>
  );
}

type Action = { label: string; onClick?: () => void; href?: string; external?: boolean; loading?: boolean };

/** The dark "Your next step" card with an ember primary and an outline secondary. */
export function NextStepCard({
  title,
  body,
  image,
  primary,
  secondary,
  kicker = "Your next step",
}: {
  title: ReactNode;
  body: ReactNode;
  image?: string | null;
  primary?: Action;
  secondary?: Action;
  kicker?: string;
}) {
  const secondaryStyle: React.CSSProperties = {
    height: 46,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.35)",
    background: "transparent",
    color: "#ffffff",
    font: "600 14px 'Instrument Sans', sans-serif",
    cursor: "pointer",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  };
  return (
    <div className="next-in" style={{ padding: 18, borderRadius: 22, background: "#12100E", color: "#ffffff", display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
      {image && (
        <span aria-hidden="true" style={{ position: "absolute", right: -24, top: -24, width: 130, height: 160, opacity: 0.14, transform: "rotate(10deg)" }}>
          <Image src={image} alt="" fill sizes="130px" style={{ objectFit: "cover" }} />
        </span>
      )}
      <span className="kick" style={{ color: "#E58A52", position: "relative" }}>
        {kicker}
      </span>
      <strong style={{ fontSize: 19, position: "relative" }}>{title}</strong>
      <span style={{ fontSize: 14, lineHeight: 1.5, color: "#DCD5CA", position: "relative" }}>{body}</span>
      {primary &&
        (primary.href && primary.external ? (
          <a href={primary.href} target="_blank" rel="noopener noreferrer" className="cta ember" style={{ height: 48, fontSize: 15, position: "relative" }}>
            {primary.label}
          </a>
        ) : (
          <Cta tone="ember" href={primary.href} onClick={primary.onClick} loading={primary.loading} style={{ height: 48, fontSize: 15, position: "relative" }}>
            {primary.label}
          </Cta>
        ))}
      {secondary &&
        (secondary.href ? (
          secondary.external ? (
            <a href={secondary.href} target="_blank" rel="noopener noreferrer" style={secondaryStyle}>
              {secondary.label}
            </a>
          ) : (
            <Link href={secondary.href} style={secondaryStyle}>
              {secondary.label}
            </Link>
          )
        ) : (
          <button type="button" onClick={secondary.onClick} style={secondaryStyle}>
            {secondary.label}
          </button>
        ))}
    </div>
  );
}
