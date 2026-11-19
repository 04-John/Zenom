"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HeaderButton, Icon, LightPage, ListCard, SearchField, Sheet } from "@/components/mobile/ui";
import { ORDER_CHIP, ORDER_LABEL, ORDER_STATUSES, type OrderStatus } from "@/lib/zenom-mobile";
import { ORDERS_BACK_KEY, remember } from "./shared";
import { OrderStatusChip } from "./StatusChip";
import { StudioHeader } from "./StudioHeader";
import { useStudio } from "./StudioMobileProvider";
import { Thumb } from "./Thumb";

export type OrderRow = {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  phone: string;
  status: OrderStatus;
  total: string;
  age: string;
  pieces: number;
  kaduna: boolean;
  image: string | null;
};

/** A 44px hit area around a 30px .pill tag. */
const TAG_HIT: React.CSSProperties = { minHeight: 44, display: "flex", alignItems: "center", border: 0, background: "none", padding: 0, cursor: "pointer" };
const rowAnim = (i: number): React.CSSProperties => ({ animation: "m-rise .45s cubic-bezier(.22,1,.36,1) both", animationDelay: `${Math.min(i, 12) * 0.035}s` });

const listUrl = (status: OrderStatus | null, q: string) => {
  const p = new URLSearchParams();
  if (status) p.set("status", status);
  if (q.trim()) p.set("q", q.trim());
  const s = p.toString();
  return `/studio/orders${s ? `?${s}` : ""}`;
};

/** Keep ?status= / ?q= in the address bar without a server round trip (filtering is client-side). */
function rememberUrl(url: string, replace: boolean) {
  if (replace) window.history.replaceState(window.history.state, "", url);
  remember(ORDERS_BACK_KEY, url);
}

// Orders tab of the light studio app. Loads the latest orders once (server)
// and filters them here, so search and the status filter are instant.
export function OrdersMobile({
  rows,
  counts,
  allCount,
  initialStatus,
  initialQ,
}: {
  rows: OrderRow[];
  counts: Record<string, number>;
  allCount: number;
  initialStatus: OrderStatus | null;
  initialQ: string;
}) {
  const { freshIds } = useStudio();
  const [status, setStatus] = useState<OrderStatus | null>(initialStatus);
  const [q, setQ] = useState(initialQ);
  const [sheet, setSheet] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    rememberUrl(listUrl(status, q), !first.current);
    first.current = false;
  }, [status, q]);

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter(
      (o) => (!status || o.status === status) && (!qq || `${o.orderNumber} ${o.customer} ${o.email} ${o.phone}`.toLowerCase().includes(qq))
    );
  }, [rows, status, q]);

  const filtering = !!status || !!q.trim();

  return (
    <LightPage desktop="hide" tabBar>
      <StudioHeader kicker="Admin" title="Orders" />
      <div className="enter-fade" style={{ padding: "4px 20px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <SearchField value={q} onChange={setQ} placeholder="Order #, name, email or phone" label="Search orders" />
          <HeaderButton label="Filter orders" icon="filter" onClick={() => setSheet(true)} dark={!!status} badge={status ? 1 : undefined} badgeTone="ember" />
        </div>

        {status && (
          <div className="enter-fade" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: "-8px 0 -6px" }}>
            <button type="button" onClick={() => setStatus(null)} aria-label={`Remove filter ${ORDER_LABEL[status]}`} style={TAG_HIT}>
              <span className="pill on">
                {ORDER_LABEL[status]} · {counts[status] ?? 0}
                <Icon name="close" size={10} stroke={3} />
              </span>
            </button>
            <button type="button" className="lnk" onClick={() => setStatus(null)} style={{ padding: "12px 4px", fontSize: 13 }}>
              Clear
            </button>
          </div>
        )}

        <p aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
          {filtering ? `${list.length} ${list.length === 1 ? "order" : "orders"} shown` : ""}
        </p>

        <ListCard>
          {list.length === 0 ? (
            <p className="sub" style={{ padding: "28px 16px", textAlign: "center", fontSize: 14 }}>
              {rows.length === 0 ? (
                "No orders yet. Commission requests and shop orders show up here."
              ) : (
                <>
                  No orders match.{" "}
                  <button
                    type="button"
                    className="lnk"
                    style={{ padding: "4px 2px" }}
                    onClick={() => {
                      setStatus(null);
                      setQ("");
                    }}
                  >
                    Show all
                  </button>
                </>
              )}
            </p>
          ) : (
            list.map((o, i) => {
              const fresh = freshIds.has(o.id);
              return (
                <Link key={o.id} href={`/studio/orders/${o.id}`} className={"mrow" + (fresh ? " row-new" : "")} style={fresh ? undefined : rowAnim(i)}>
                  <Thumb src={o.image} w={40} h={50} />
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ display: "flex", gap: 6, alignItems: "baseline", minWidth: 0 }}>
                      <strong style={{ fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{o.customer}</strong>
                      <span style={{ fontSize: 11, color: "#4A433B", flex: "none" }}>{o.orderNumber}</span>
                    </span>
                    <span style={{ fontSize: 12, color: "#4A433B" }}>
                      {o.age} · {o.pieces} {o.pieces === 1 ? "piece" : "pieces"} · {o.kaduna ? "Kaduna" : "Outside"}
                    </span>
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flex: "none" }}>
                    <strong style={{ fontSize: 13 }}>{o.total}</strong>
                    <OrderStatusChip status={o.status} size="xs" />
                  </span>
                </Link>
              );
            })
          )}
        </ListCard>

        {rows.length < allCount && (
          <p style={{ margin: 0, fontSize: 12, color: "#4A433B", textAlign: "center" }}>
            Showing the latest {rows.length} of {allCount} orders. Older ones are in the desktop studio.
          </p>
        )}
      </div>

      <Sheet open={sheet} onClose={() => setSheet(false)} label="Filter orders">
        <p className="gh" style={{ marginBottom: 4 }}>
          Status
        </p>
        <div>
          {([null, ...ORDER_STATUSES] as (OrderStatus | null)[]).map((s) => {
            const on = status === s;
            const chip = s ? { background: ORDER_CHIP[s][0], color: ORDER_CHIP[s][1] } : { background: "#ffffff", color: "#1A1714", border: "1px solid #E8E2D8" };
            return (
              <button
                key={s ?? "all"}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setStatus(s);
                  setSheet(false);
                }}
                style={{
                  width: "100%",
                  minHeight: 50,
                  border: 0,
                  borderBottom: "1px solid #EFEAE2",
                  background: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  font: "500 16px 'Instrument Sans', sans-serif",
                  color: "#1A1714",
                  padding: "0 4px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span className="chipst" style={{ height: 24, fontSize: 12, ...chip }}>
                  {s ? ORDER_LABEL[s] : "All orders"}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: "#4A433B" }}>{s ? counts[s] ?? 0 : allCount}</span>
                {on && <Icon name="check" size={20} stroke={3} style={{ color: "#9A4A1F", animation: "m-pop .35s cubic-bezier(.34,1.56,.64,1) both" }} />}
              </button>
            );
          })}
        </div>
      </Sheet>
    </LightPage>
  );
}
