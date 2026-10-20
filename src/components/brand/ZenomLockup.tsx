import { ZenomMark } from "./ZenomMark";

/**
 * The lockups from the "LOCKUPS & COLOURWAYS" board.
 *
 *  variant="horizontal" tone="dark"   → mark + "Zenom / STUDIO" on night   (board tile 1)
 *  variant="horizontal" tone="paper"  → same on paper, rust dot            (board tile 2)
 *  variant="stacked"                  → mark over "Zenom Studio" + tagline (board tile 3)
 *  variant="badge"                    → mark alone on an ember tile        (board tile 4)
 *
 * `size` scales the whole lockup (1 = board size, mark 120px / wordmark 84px).
 * Fonts: expects CSS variables --font-display (Instrument Serif) and --font-mono
 * (JetBrains Mono) from next/font — see README.
 */

export type LockupVariant = "horizontal" | "stacked" | "badge";
export type LockupTone = "dark" | "paper";

const TONES = {
  dark: { ink: "#EFE9DF", accent: "#E58A52", sub: "#A39B90", sub2: "#8F877C" },
  paper: { ink: "#1A1714", accent: "#9A4A1F", sub: "#4A433B", sub2: "#7A7066" },
} as const;

type Props = {
  variant?: LockupVariant;
  tone?: LockupTone;
  size?: number;
  tagline?: string;
  /** draw the mark in on mount (e.g. hero / loader) */
  animate?: boolean;
  className?: string;
};

const display = "var(--font-display), 'Instrument Serif', serif";
const mono = "var(--font-mono), 'JetBrains Mono', monospace";

export function ZenomLockup({ variant = "horizontal", tone = "dark", size = 1, tagline = "More than a portrait", animate, className }: Props) {
  const t = TONES[tone];
  const draw = animate ? "once" : "none";

  if (variant === "badge") {
    const box = Math.round(220 * size);
    return (
      <div
        className={className}
        style={{ width: box, height: box, borderRadius: 22 * size, background: "#E58A52", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <ZenomMark size={Math.round(150 * size)} ink="#12100E" accent="#F5F0E7" draw={draw} />
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div className={className} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 * size, color: t.ink }}>
        <span aria-hidden style={{ display: "block" }}>
          <ZenomMark size={Math.round(110 * size)} ink={t.ink} accent={t.accent} draw={draw} title="" />
        </span>
        <div style={{ fontFamily: display, fontStyle: "italic", fontSize: 36 * size, lineHeight: 1 }}>Zenom Studio</div>
        {tagline && (
          <div style={{ fontFamily: mono, fontSize: Math.max(9, 9 * size), letterSpacing: "0.3em", color: t.sub2, textTransform: "uppercase" }}>{tagline}</div>
        )}
      </div>
    );
  }

  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: 22 * size, color: t.ink }}>
      <span aria-hidden style={{ display: "block" }}>
        <ZenomMark size={Math.round(120 * size)} ink={t.ink} accent={t.accent} draw={draw} title="" />
      </span>
      <div>
        <div style={{ fontFamily: display, fontStyle: "italic", fontSize: 84 * size, lineHeight: 0.85 }}>Zenom</div>
        <div style={{ fontFamily: mono, fontSize: Math.max(8, 12 * size), letterSpacing: "0.5em", color: t.sub, marginTop: 10 * size }}>STUDIO</div>
      </div>
    </div>
  );
}

/** Compact nav lockup: simplified mark + italic wordmark (site header pill). */
export function ZenomNavLogo({ tone = "dark" }: { tone?: LockupTone }) {
  const t = TONES[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color: t.ink }}>
      <span aria-hidden style={{ display: "block" }}>
        <ZenomMark size={30} ink={t.ink} accent={t.accent} title="" />
      </span>
      <span style={{ fontFamily: display, fontStyle: "italic", fontSize: 21, lineHeight: 1 }}>Zenom</span>
    </span>
  );
}

export default ZenomLockup;
