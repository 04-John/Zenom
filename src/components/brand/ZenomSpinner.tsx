"use client";

import { ZenomMark } from "./ZenomMark";

/**
 * Every in-page loading state: the mark drawing itself on a loop.
 *  <ZenomSpinner />                      – inline, 40px (buttons, cards)
 *  <ZenomSpinner size={120} label="…" /> – section / page loading
 *  <ZenomSpinner fullscreen />           – route transitions (app/loading.tsx)
 */
type Props = { size?: number; label?: string; fullscreen?: boolean; tone?: "dark" | "paper" };

export function ZenomSpinner({ size = 40, label, fullscreen, tone = "dark" }: Props) {
  const ink = tone === "dark" ? "#EFE9DF" : "#1A1714";
  const accent = tone === "dark" ? "#E58A52" : "#9A4A1F";
  const body = (
    <div role="status" aria-live="polite" style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      {/* small sizes still animate: simplified drawing, same one-stroke motion */}
      <ZenomMark size={size} ink={ink} accent={accent} draw="loop" duration={size < 48 ? 1600 : 2600} />
      {label ? (
        <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.24em", color: tone === "dark" ? "#8F877C" : "#7A7066", textTransform: "uppercase" }}>{label}</span>
      ) : (
        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Loading</span>
      )}
    </div>
  );
  if (!fullscreen) return body;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(12,11,9,0.92)", backdropFilter: "blur(6px)" }}>
      {body}
    </div>
  );
}

export default ZenomSpinner;
