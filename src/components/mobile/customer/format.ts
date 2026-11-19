const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-12-15" → "15 Dec 2026" without timezone drift; "" → "Any time". */
export function prettyDate(ymd?: string | null): string {
  const p = (ymd ?? "").split("-");
  if (p.length !== 3 || !p[1] || !MON[+p[1] - 1]) return "Any time";
  return `${+p[2]} ${MON[+p[1] - 1]} ${p[0]}`;
}

/** Today as "YYYY-MM-DD" in the viewer's timezone (min for the date picker). */
export function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
