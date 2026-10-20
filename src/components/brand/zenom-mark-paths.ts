// Geometry for the "Unbroken Line" mark. viewBox: -10 -10 220 220.
// A single stroke: top bar → profile along the Z diagonal (forehead, brow, nose,
// lips, chin, throat) → bottom bar, ending on the ember "pencil tip" dot.

type Pt = [number, number];
const K = Math.SQRT1_2;
// u = distance along the diagonal from the top-right corner; v = offset toward the upper-left (face looks up-left)
const XY = (u: number, v: number): Pt => [160 - (u + v) * K, 40 + (u - v) * K];
const n2 = (a: Pt) => `${a[0].toFixed(2)} ${a[1].toFixed(2)}`;

const PROFILE: Pt[] = [[8,0.5],[18,1.5],[31,4.5],[40,6.8],[47,3.2],[55,2.6],[64,10],[72,19],[75.5,19.8],[78,14.5],[80,8.8],[85,8],[90,11.8],[93.5,7.8],[97,8.6],[100.5,10.6],[105,5],[110,5],[117,11.2],[122,10],[127,1],[134,-7],[146,-8],[156,-4],[162,-0.5]];
const PROFILE_SIMPLE: Pt[] = [[8,0.5],[28,3],[42,7],[52,2],[74,23],[80,10],[88,12.5],[93,8],[99,11.5],[106,4],[118,12.5],[126,2],[140,-7],[162,-0.5]];

function spline(P: Pt[]) {
  let d = "";
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
    d += ` C${n2([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${n2([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${n2(p2)}`;
  }
  return d;
}
const build = (prof: Pt[]) => {
  const P = prof.map(([u, v]) => XY(u, v));
  return `M40 40 L150 40 Q160 40 ${n2(P[0])}` + spline(P) + ` Q40 160 52 160 L152 160`;
};

export const MARK_VIEWBOX = "-10 -10 220 220";
export const MARK_LINE = build(PROFILE);
export const MARK_LINE_SIMPLE = build(PROFILE_SIMPLE);
/** closed eye + lash + mouth line (full mark only) */
export const MARK_FEATURES = `M${n2(XY(45.5,-17))} Q${n2(XY(57,-11.5))} ${n2(XY(49.5,-5.2))} M${n2(XY(52.8,-8.6))} L${n2(XY(57.5,-6.2))} M${n2(XY(54,-12.6))} L${n2(XY(58.8,-12.2))} M${n2(XY(93.4,6.6))} L${n2(XY(95.6,1.2))}`;
export const MARK_DOT = { cx: 166, cy: 160 };

/** Stroke width (in viewBox units) tuned per rendered size so the line looks even. */
export function strokeFor(px: number, simple: boolean) {
  if (simple) return px <= 16 ? 19 : px <= 24 ? 16 : px <= 40 ? 13 : 12;
  return px >= 400 ? 5.5 : px >= 150 ? 6.5 : px >= 90 ? 8 : 10;
}
