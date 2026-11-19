"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Chip, Cta, LightPage, ListCard, SearchField, TabHeader } from "@/components/mobile/ui";
import { CustomerHeaderButtons, useCustomer } from "./CustomerChrome";
import { customerChip, isActive, orderLine, type CustomerOrder } from "./model";

const SEEN_KEY = "zs.seenOrders";

/** Mobile Orders tab (/account and /account/orders, below 900px). */
export function OrdersScreen({ newId }: { newId?: string }) {
  const { orders, user } = useCustomer();
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState<Set<string>>(() => new Set());

  // A just-submitted order (?new=<id>) and any order this browser hasn't seen
  // before flash in once (.row-new).
  useEffect(() => {
    let seen: string[] | null = null;
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      seen = raw ? (JSON.parse(raw) as string[]) : null;
    } catch {
      /* storage unavailable */
    }
    const fresh = new Set<string>();
    if (newId) fresh.add(newId);
    if (seen) for (const o of orders) if (!seen.includes(o.id)) fresh.add(o.id);
    if (fresh.size) setFlash(fresh);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(orders.map((o) => o.id)));
    } catch {
      /* ignore */
    }
  }, [orders, newId]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((o) =>
      [o.orderNumber, o.title, o.size, o.medium, customerChip(o).label, ...o.items.map((i) => i.title)]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle))
    );
  }, [orders, q]);

  const reviewing = orders.find((o) => o.status === "PENDING");
  const active = orders.filter(isActive).length;

  return (
    <LightPage desktop="hide" tabBar>
      <TabHeader kicker={user.name || user.email || "Your studio"} title="Orders" right={<CustomerHeaderButtons plus />} />
      <div className="enter-fade" style={{ padding: "4px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {orders.length > 0 && <SearchField value={q} onChange={setQ} placeholder="Search orders, sizes, artworks…" label="Search orders" />}

        {reviewing && !q && (
          <div className="next-in" role="status" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", borderRadius: 16, background: "#FBEBDD", fontSize: 13, lineHeight: 1.5, color: "#4A2410" }}>
            <span className="pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "#E58A52", flex: "none", marginTop: 4 }} />
            <span>
              Samuel is reviewing <strong>{reviewing.orderNumber}</strong>. We&apos;ll let you know here when your quote is ready.
            </span>
          </div>
        )}

        {orders.length === 0 ? (
          <EmptyOrders />
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>All orders</h2>
              <span style={{ fontSize: 12, color: "#4A433B" }}>Active ({active})</span>
            </div>
            {shown.length === 0 ? (
              <p className="sub" style={{ textAlign: "center", padding: "18px 0" }} role="status">
                No orders match “{q.trim()}”.
              </p>
            ) : (
              <ListCard>
                {shown.map((o) => (
                  <OrderRow key={o.id} order={o} flash={flash.has(o.id)} />
                ))}
              </ListCard>
            )}
          </>
        )}
      </div>
    </LightPage>
  );
}

function OrderRow({ order: o, flash }: { order: CustomerOrder; flash: boolean }) {
  const chip = customerChip(o);
  return (
    <Link href={`/account/orders/${o.id}`} className={"mrow" + (flash ? " row-new" : "")}>
      <Image src={o.image} alt="" width={80} height={100} sizes="40px" style={{ width: 40, height: 50, objectFit: "cover", borderRadius: 8, flex: "none" }} />
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{orderLine(o)}</span>
        <span style={{ fontSize: 12, color: "#4A433B" }}>
          {o.orderNumber} · {o.framed ? "Framed" : "Paper only"}
        </span>
      </span>
      <Chip bg={chip.bg} fg={chip.fg}>
        {chip.label}
      </Chip>
    </Link>
  );
}

function EmptyOrders() {
  return (
    <ListCard style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
      <span className="kick" style={{ color: "#9A4A1F" }}>
        No orders yet
      </span>
      <h2 className="h1" style={{ fontSize: 28 }}>
        Your first commission starts here.
      </h2>
      <p className="sub" style={{ fontSize: 14 }}>
        Pick a room and a size, add your photo, and Samuel sends your quote on WhatsApp. Requests you send while signed in show up here.
      </p>
      <Cta tone="ember" href="/commission?start=1" arrow>
        Start a commission
      </Cta>
    </ListCard>
  );
}
