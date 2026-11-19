import Link from "next/link";
import { Icon, LightPage } from "@/components/mobile/ui";
import { CATEGORY_LABEL, formatNaira, fromDbCategory, type DbCategory } from "@/lib/pricing";
import { CATEGORIES, type RangeKey, type getDashboard } from "@/lib/studio-stats";
import { ORDER_STATUSES, kfmt } from "@/lib/zenom-mobile";
import { RangeControl } from "./RangeControl";
import { StudioHeader } from "./StudioHeader";
import { OrderStatusChip } from "./StatusChip";
import { Thumb } from "./Thumb";

type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
const kick: React.CSSProperties = { fontSize: 9, color: "#4A433B" };

// Studio overview, light app (below 900px). Server-rendered from the same
// getDashboard() result as the desktop dashboard, so both show one set of
// numbers. Layout follows Studio-Mobile.dc.html (tabOverview).
export function OverviewMobile({ d, range }: { d: Dashboard; range: RangeKey }) {
  const { kpis } = d;
  const kpiCards: [string, string, string][] = [
    ["Confirmed sales", formatNaira(kpis.confirmedSales), "Deposit received, not cancelled"],
    ["Cash collected", formatNaira(kpis.cashCollected), `${formatNaira(kpis.balanceDue)} balance still due`],
    ["Pipeline", formatNaira(kpis.pipelineValue), `${plural(kpis.pipelineCount, "order")} awaiting a deposit`],
    ["Avg. order", formatNaira(kpis.avgOrder), `${plural(kpis.orderCount, "order")}, ${kpis.cancelled} cancelled`],
    ["In production", String(kpis.inProductionPieces), "Pieces being drawn"],
    ["Customers", String(kpis.customers), plural(kpis.repeatBuyers, "repeat buyer")],
    ["Framed", `${kpis.framedPct}%`, "Share of pieces ordered with a frame"],
    ["Kaduna delivery", `${kpis.kadunaPct}%`, "Rest quoted on WhatsApp"],
  ];

  const bars = d.salesBars;
  const salesTotal = bars.reduce((a, b) => a + b.value, 0);
  const bmax = Math.max(1, ...bars.map((b) => b.value));
  const cmax = Math.max(1, ...CATEGORIES.map((c) => d.byCategory[c].revenue));
  const best = d.topArtworks.slice(0, 3);
  const latest = d.recent.slice(0, 3);

  return (
    <LightPage desktop="hide" tabBar>
      <StudioHeader kicker="Admin" title="Studio overview" />
      <div className="enter-fade" style={{ padding: "4px 20px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#4A433B" }}>{range === "all" ? "All time" : `Last ${range} days`}</span>
          <RangeControl value={range} />
        </div>

        {/* 8 KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {kpiCards.map(([label, value, sub], i) => (
            <div key={label} className="kpi" style={{ animationDelay: `${i * 0.04}s` }}>
              <span className="kick" style={kick}>
                {label}
              </span>
              <b>{value}</b>
              <small>{sub}</small>
            </div>
          ))}
        </div>

        {/* Sales bars: 6 buckets, latest in ember */}
        <section className="card" aria-labelledby="ov-sales">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <h2 id="ov-sales" className="kick" style={{ ...kick, margin: 0, fontWeight: 500 }}>
              Confirmed sales over time
            </h2>
            <strong style={{ fontSize: 13 }}>{formatNaira(salesTotal)}</strong>
          </div>
          <div
            role="img"
            aria-label={"Confirmed sales by period: " + bars.map((b) => `${b.label === "Now" ? "latest" : b.label} ${formatNaira(b.value)}`).join(", ")}
            style={{ height: 120, display: "flex", alignItems: "flex-end", gap: 8, borderBottom: "1px solid #EFEAE2" }}
          >
            {bars.map((b, i) => (
              <span key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 4, height: "100%" }}>
                <span style={{ fontSize: 10, color: "#4A433B", whiteSpace: "nowrap" }}>{b.value ? kfmt(b.value) : ""}</span>
                <span
                  className="bar"
                  style={{
                    width: "100%",
                    borderRadius: "8px 8px 3px 3px",
                    height: Math.max(4, Math.round((b.value / bmax) * 88)),
                    animationDelay: `${i * 0.06}s`,
                    background: b.value ? (i === bars.length - 1 ? "#E58A52" : "#1A1714") : "#EFEAE2",
                  }}
                />
              </span>
            ))}
          </div>
          <div aria-hidden="true" style={{ display: "flex", gap: 8 }}>
            {bars.map((b, i) => (
              <span key={i} style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: 10, color: "#4A433B" }}>
                {b.label}
              </span>
            ))}
          </div>
          {salesTotal === 0 && <span style={{ fontSize: 13, color: "#4A433B" }}>No confirmed sales in this period yet.</span>}
        </section>

        {/* Order pipeline: tap a row for the filtered order list */}
        <section className="card" aria-labelledby="ov-pipe">
          <h2 id="ov-pipe" className="kick" style={{ ...kick, margin: 0, fontWeight: 500 }}>
            Order pipeline
          </h2>
          <div>
            {ORDER_STATUSES.map((s) => (
              <Link key={s} href={`/studio/orders?status=${s}`} className="stat">
                <OrderStatusChip status={s} size="sm" />
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 15 }}>{d.statusCounts[s] ?? 0}</strong>
                  <Icon name="chevronRight" size={14} stroke={2} style={{ color: "#857C71" }} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="card" aria-labelledby="ov-cats">
          <h2 id="ov-cats" className="kick" style={{ ...kick, margin: 0, fontWeight: 500 }}>
            Categories
          </h2>
          {CATEGORIES.map((c) => {
            const rev = d.byCategory[c];
            const s = d.stock[c];
            return (
              <div key={c} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14 }}>
                  <strong>{CATEGORY_LABEL[fromDbCategory(c as DbCategory)]}</strong>
                  <span style={{ color: "#4A433B" }}>
                    {formatNaira(rev.revenue)} · {rev.pieces} pc
                  </span>
                </span>
                <span className="hbar">
                  <span className="hfill" style={{ width: `${Math.max(2, Math.round((rev.revenue / cmax) * 100))}%` }} />
                </span>
                <span style={{ fontSize: 11, color: s.available === 0 ? "#9A4A1F" : "#4A433B" }}>
                  {s.available} on sale · {s.soldOut} sold out · {s.draft} draft · {s.comingSoon} coming soon
                </span>
              </div>
            );
          })}
        </section>

        {/* Best sellers */}
        <section className="card" aria-labelledby="ov-best">
          <h2 id="ov-best" className="kick" style={{ ...kick, margin: 0, fontWeight: 500 }}>
            Best-selling artworks
          </h2>
          {best.length === 0 ? (
            <span style={{ fontSize: 13, color: "#4A433B" }}>No orders in this period yet.</span>
          ) : (
            best.map((a, i) => (
              <div key={`${a.code}-${a.name}`} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 18, fontSize: 12, color: "#9A4A1F", fontWeight: 700 }}>{i + 1}</span>
                <Thumb src={a.image} w={36} h={45} />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</strong>
                  <span style={{ fontSize: 11, color: "#4A433B" }}>
                    {a.code ? `${a.code} · ` : ""}
                    {a.pieces} ordered
                  </span>
                </span>
                <strong style={{ fontSize: 13 }}>{formatNaira(a.revenue)}</strong>
              </div>
            ))
          )}
        </section>

        {/* Latest orders */}
        <section className="card" aria-labelledby="ov-latest">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 id="ov-latest" className="kick" style={{ ...kick, margin: 0, fontWeight: 500 }}>
              Latest orders
            </h2>
            <Link href="/studio/orders" className="lnk" style={{ padding: "12px 0", margin: "-12px 0" }}>
              All orders
            </Link>
          </div>
          {latest.length === 0 ? (
            <span style={{ fontSize: 13, color: "#4A433B" }}>No orders in this period yet.</span>
          ) : (
            <div style={{ margin: "0 -16px" }}>
              {latest.map((o) => (
                <Link key={o.id} href={`/studio/orders/${o.id}?from=overview`} className="mrow">
                  <Thumb src={o.image} w={36} h={45} />
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <strong style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customerName}</strong>
                    <span style={{ fontSize: 11, color: "#4A433B" }}>
                      {o.orderNumber} · {formatNaira(o.total)}
                    </span>
                  </span>
                  <OrderStatusChip status={o.status} size="xs" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Link href="/studio/products" className="sec" style={{ height: 46, fontSize: 14 }}>
            Manage artworks
          </Link>
          <Link href="/studio/orders" className="sec" style={{ height: 46, fontSize: 14 }}>
            Manage orders
          </Link>
        </div>
      </div>
    </LightPage>
  );
}
