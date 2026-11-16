"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/pricing";

type Point = { date: string; orders: number; revenue: number };

// Dependency-free SVG bar chart: bars = confirmed revenue per day (or week),
// hover/focus a bar to read the exact figure.
export function RevenueChart({ data }: { data: Point[] }) {
  const [active, setActive] = useState<number | null>(null);
  const W = 800;
  const H = 200;
  const max = Math.max(1, ...data.map((p) => p.revenue));
  const bw = W / Math.max(1, data.length);
  const total = data.reduce((a, p) => a + p.revenue, 0);
  const shown = active !== null ? data[active] : null;

  if (total === 0) {
    return <p className="mt-5 text-sm text-ink-3">No confirmed sales in this period yet.</p>;
  }

  return (
    <div className="mt-4">
      <p className="h-12 text-sm text-ink-2">
        {shown ? (
          <>
            <span className="text-ink">{new Date(shown.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            {" — "}
            {formatNaira(shown.revenue)} from {shown.orders} order{shown.orders === 1 ? "" : "s"}
          </>
        ) : (
          <>Total {formatNaira(total)} · hover a bar for details</>
        )}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" role="img" aria-label="Confirmed sales over time">
        <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} stroke="currentColor" className="text-ink/20" />
        {data.map((p, i) => {
          const h = (p.revenue / max) * (H - 8);
          return (
            <g key={p.date} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} tabIndex={0}>
              <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
              <rect
                x={i * bw + bw * 0.15}
                y={H - h}
                width={Math.max(1, bw * 0.7)}
                height={h}
                rx={2}
                className={active === i ? "fill-ember" : "fill-ink/70"}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}
