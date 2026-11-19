import { MARK_DOT, MARK_FEATURES, MARK_LINE, MARK_VIEWBOX } from "@/components/brand/zenom-mark-paths";

type Props = {
  size: number;
  /** stroke width in viewBox units */
  stroke?: number;
  /** false renders the undrawn state (nothing visible) until the draw should start */
  play?: boolean;
  drawMs?: number;
  delayMs?: number;
  popMs?: number;
  /** accessible name; empty string hides it from assistive tech */
  label?: string;
  className?: string;
};

// The mark drawing itself with CSS only (stroke-dashoffset 1 → 0 on a
// pathLength=1 path, zDraw), then the ember pencil-tip dot pops (zPop).
// Used by the mobile splash and the "Order sent" screen.
// While playing, the base style is the finished mark and the animations
// (fill: both) supply the undrawn start, so anything that strips animations
// (reduced motion, the page-transition snapshot) still shows the mark.
export function DrawnMark({ size, stroke = 12, play = true, drawMs = 1500, delayMs = 200, popMs = 1900, label = "Zenom Studio", className }: Props) {
  const line: React.CSSProperties = play
    ? { strokeDasharray: 1, strokeDashoffset: 0, animation: `zDraw ${drawMs}ms cubic-bezier(.65,0,.35,1) ${delayMs}ms both` }
    : { strokeDasharray: 1, strokeDashoffset: 1 };
  const features: React.CSSProperties = play
    ? { animation: `zFadeOut ${Math.round(drawMs * 0.3)}ms ease ${delayMs + drawMs}ms reverse both` }
    : { opacity: 0 };
  const dot: React.CSSProperties = {
    transformOrigin: `${MARK_DOT.cx}px ${MARK_DOT.cy}px`,
    ...(play ? { animation: `zPop ${popMs}ms cubic-bezier(.16,1,.3,1) both` } : { transform: "scale(0)" }),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={MARK_VIEWBOX}
      role={label ? "img" : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      <g fill="none" stroke="#EFE9DF" strokeLinecap="round" strokeLinejoin="round">
        <path d={MARK_LINE} pathLength={1} strokeWidth={stroke} style={line} />
        <path d={MARK_FEATURES} strokeWidth={stroke * 0.55} style={features} />
      </g>
      <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={stroke} fill="#E58A52" style={dot} />
    </svg>
  );
}
