import { ICON, type IconName } from "./icons";

type Props = {
  /** a name from ICON, or raw path data (string or list of strings) */
  name?: IconName;
  d?: string | readonly string[];
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
};

// Stroked 24×24 icon, decorative by default (aria-hidden). Give the button
// around it an aria-label.
export function Icon({ name, d, size = 20, stroke = 1.8, className, style }: Props) {
  const paths = d ?? (name ? ICON[name] : "");
  const list = typeof paths === "string" ? [paths] : paths;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      {list.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}

/** The spinning arc used inside a loading .cta */
export function SpinArc({ size = 22, color = "#ffffff" }: { size?: number; color?: string }) {
  return (
    <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}
