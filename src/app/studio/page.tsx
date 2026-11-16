import Link from "next/link";
import { formatNaira, CATEGORY_LABEL, type Category } from "@/lib/pricing";
import { CATEGORIES, RANGES, getDashboard, parseRange } from "@/lib/studio-stats";
import { linkPrimary, linkSecondary } from "./buttonStyles";
import { StatusBadge } from "./StatusBadge";
import { RevenueChart } from "./RevenueChart";

export const dynamic = "force-dynamic";

const catLabel = (c: string) => CATEGORY_LABEL[c.toLowerCase() as Category] ?? c;

export default async function StudioDashboard({ searchParams }: { searchParams: { range?: string } }) {
  const range = parseRange(searchParams.range);
  const d = await getDashboard(range);
  const { kpis } = d;

  const empty = CATEGORIES.filter((c) => d.stock[c].available === 0);
  const awaiting = d.statusCounts.AWAITING_DEPOSIT ?? 0;
  const pending = d.statusCounts.PENDING ?? 0;
  const inProduction = d.statusCounts.IN_PRODUCTION ?? 0;
  const maxCat = Math.max(1, ...CATEGORIES.map((c) => d.byCategory[c].revenue));
  const maxArt = Math.max(1, ...d.topArtworks.map((a) => a.pieces));

  return (
    <div className="pb-24 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Admin</p>
          <h1 className="h-section mt-3">Studio overview</h1>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Date range">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/studio?range=${r.key}`}
              className={`rounded-pill border px-4 py-2 text-sm ${
                range === r.key ? "border-ink bg-ink text-night" : "border-ink/20 text-ink-2 hover:text-ink"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Needs attention */}
      {(empty.length > 0 || awaiting + pending > 0) && (
        <div className="mt-8 space-y-3">
          {empty.length > 0 && (
            <Alert tone="ember">
              <strong>Nothing left to sell in {empty.map(catLabel).join(", ")}.</strong> Every piece there is sold out,
              a draft or coming soon.{" "}
              <Link href="/studio/products/new" className="underline">
                Add new artwork
              </Link>{" "}
              or{" "}
              <Link href="/studio/products?status=SOLD_OUT" className="underline">
                put sold-out pieces back on sale
              </Link>
              .
            </Alert>
          )}
          {awaiting + pending > 0 && (
            <Alert>
              <strong>
                {awaiting + pending} order{awaiting + pending === 1 ? "" : "s"} waiting on a deposit.
              </strong>{" "}
              <Link href="/studio/orders?status=AWAITING_DEPOSIT" className="underline">
                Review them
              </Link>
              .
            </Alert>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Confirmed sales" value={formatNaira(kpis.confirmedSales)} hint="Deposit received, not cancelled" />
        <Kpi label="Cash collected" value={formatNaira(kpis.cashCollected)} hint={`${formatNaira(kpis.balanceDue)} balance still due`} />
        <Kpi label="Pipeline" value={formatNaira(kpis.pipelineValue)} hint="Orders awaiting a deposit" />
        <Kpi label="Avg. order" value={formatNaira(kpis.avgOrder)} hint={`${kpis.orderCount} orders, ${kpis.cancelled} cancelled`} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="In production" value={String(inProduction)} hint="Pieces being drawn" small />
        <Kpi label="Customers" value={String(kpis.customers)} hint={`${kpis.repeatBuyers} repeat buyers`} small />
        <Kpi label="Framed" value={`${kpis.framedPct}%`} hint="Share of pieces ordered with a frame" small />
        <Kpi label="Kaduna delivery" value={`${kpis.kadunaPct}%`} hint="Rest quoted on WhatsApp" small />
      </div>

      {/* Sales over time */}
      <section className="mt-8 rounded-card border border-ink/10 bg-night-raised p-6">
        <h2 className="label-mono">Confirmed sales over time</h2>
        <RevenueChart data={d.series} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Category performance + catalogue health */}
        <section className="rounded-card border border-ink/10 bg-night-raised p-6">
          <h2 className="label-mono">Categories</h2>
          <ul className="mt-5 space-y-5">
            {CATEGORIES.map((c) => {
              const s = d.stock[c];
              const rev = d.byCategory[c];
              return (
                <li key={c}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <Link href={`/studio/products?category=${c}`} className="font-medium text-ink hover:text-ember">
                      {catLabel(c)}
                    </Link>
                    <span className="text-ink-2">
                      {formatNaira(rev.revenue)} · {rev.pieces} pc
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-pill bg-ink/10">
                    <div className="h-full rounded-pill bg-ember" style={{ width: `${(rev.revenue / maxCat) * 100}%` }} />
                  </div>
                  <p className={`mt-2 text-xs ${s.available === 0 ? "text-ember" : "text-ink-3"}`}>
                    {s.available} on sale · {s.soldOut} sold out · {s.draft} draft · {s.comingSoon} coming soon
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Best sellers */}
        <section className="rounded-card border border-ink/10 bg-night-raised p-6">
          <h2 className="label-mono">Best-selling artworks</h2>
          {d.topArtworks.length === 0 ? (
            <p className="mt-5 text-sm text-ink-3">No orders in this period yet.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {d.topArtworks.map((a) => (
                <li key={`${a.code}-${a.name}`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink">
                      {a.name} <span className="font-mono text-xs text-ink-3">{a.code}</span>
                    </span>
                    <span className="text-ink-2">
                      {a.pieces} sold · {formatNaira(a.revenue)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-ink/10">
                    <div className="h-full rounded-pill bg-ink" style={{ width: `${(a.pieces / maxArt) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {d.sizes.length > 0 && (
            <p className="mt-6 text-xs text-ink-3">
              Sizes ordered: {d.sizes.map(([s, n]) => `${s} (${n})`).join(" · ")}
            </p>
          )}
        </section>
      </div>

      {/* Order pipeline + recent */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-card border border-ink/10 bg-night-raised p-6">
          <h2 className="label-mono">Order pipeline</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {["AWAITING_DEPOSIT", "PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"].map((s) => (
              <li key={s} className="flex items-center justify-between gap-3">
                <Link href={`/studio/orders?status=${s}`} className="hover:opacity-80">
                  <StatusBadge status={s} />
                </Link>
                <span className="text-ink">{d.statusCounts[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-card border border-ink/10 bg-night-raised p-6">
          <div className="flex items-center justify-between">
            <h2 className="label-mono">Latest orders</h2>
            <Link href="/studio/orders" className="text-sm text-ink-2 underline hover:text-ember">
              All orders
            </Link>
          </div>
          {d.recent.length === 0 ? (
            <p className="mt-5 text-sm text-ink-3">No orders in this period yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10 text-sm">
              {d.recent.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <Link href={`/studio/orders/${o.id}`} className="font-mono text-xs text-ink underline hover:text-ember">
                    {o.orderNumber}
                  </Link>
                  <span className="text-ink-2">{o.customerName}</span>
                  <StatusBadge status={o.status} />
                  <span className="text-ink">{formatNaira(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/studio/products/new" className={linkPrimary}>
          + Add artwork
        </Link>
        <Link href="/studio/products" className={linkSecondary}>
          Manage artworks
        </Link>
        <Link href="/studio/orders" className={linkSecondary}>
          Manage orders
        </Link>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, small }: { label: string; value: string; hint: string; small?: boolean }) {
  return (
    <div className="rounded-card border border-ink/10 bg-night-raised p-5">
      <p className="label-mono">{label}</p>
      <p className={`mt-2 break-words font-display ${small ? "text-3xl" : "text-3xl lg:text-4xl"} text-ink`}>{value}</p>
      <p className="mt-2 text-xs text-ink-3">{hint}</p>
    </div>
  );
}

function Alert({ children, tone }: { children: React.ReactNode; tone?: "ember" }) {
  return (
    <div
      className={`rounded-tile border px-5 py-4 text-sm ${
        tone === "ember" ? "border-ember/50 bg-ember/10 text-ink" : "border-ink/15 bg-night-raised text-ink-2"
      }`}
    >
      {children}
    </div>
  );
}
