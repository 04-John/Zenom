const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-12-15" → "15 Dec 2026" without timezone drift; "" → "Any time". */
export function prettyDate(ymd?: string | null): string {
  const p = (ymd ?? "").split("-");
  if (p.length !== 3 || !p[1] || !MON[+p[1] - 1]) return "Any time";
  return `${+p[2]} ${MON[+p[1] - 1]} ${p[0]}`;
}

/**
 * "12 Nov 2026" for a timestamp, in Kaduna time (UTC+1, no daylight saving),
 * so the server render and the browser always agree.
 */
export function studioDate(iso?: string | null): string {
  const t = Date.parse(iso ?? "");
  if (Number.isNaN(t)) return "";
  const d = new Date(t + 3_600_000);
  return `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Today as "YYYY-MM-DD" in the viewer's timezone (min for the date picker). */
export function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
