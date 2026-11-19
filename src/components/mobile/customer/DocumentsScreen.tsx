"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Chip, Cta, Icon, LightPage, ListCard, SearchField, TabHeader } from "@/components/mobile/ui";
import { CustomerHeaderButtons, useCustomer } from "./CustomerChrome";
import { DOC_KINDS, DOC_META, docHref, docReady, orderLine, type DocKind } from "./model";

type Filter = "all" | DocKind;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "invoice", label: "Invoices" },
  { key: "receipt", label: "Receipts" },
  { key: "certificate", label: "Certificates" },
];

/** Documents tab (/account/documents): invoice, deposit receipt and certificate per order. */
export function DocumentsScreen() {
  const { orders } = useCustomer();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const docs = useMemo(
    () =>
      orders
        .filter((o) => o.status !== "CANCELLED")
        .flatMap((o) => DOC_KINDS.map((kind) => ({ o, kind, ready: docReady(o.status, kind) }))),
    [orders]
  );

  const needle = q.trim().toLowerCase();
  const shown = docs.filter(
    (d) =>
      (filter === "all" || d.kind === filter) &&
      (!needle || [d.o.orderNumber, orderLine(d.o), DOC_META[d.kind].title].some((s) => s.toLowerCase().includes(needle)))
  );

  return (
    <LightPage desktop="column" tabBar className="min-[900px]:pt-24">
      <TabHeader kicker="All orders" title="Documents" right={<CustomerHeaderButtons />} />
      <div className="enter-fade" style={{ padding: "4px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {orders.length === 0 ? (
          <ListCard style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="kick" style={{ color: "#9A4A1F" }}>
              Nothing here yet
            </span>
            <p className="sub" style={{ fontSize: 14 }}>
              Your invoice, deposit receipt and certificate of authenticity appear here as each order moves along.
            </p>
            <Cta tone="ember" href="/commission?start=1" arrow>
              Start a commission
            </Cta>
          </ListCard>
        ) : (
          <>
            <SearchField value={q} onChange={setQ} placeholder="Search documents" label="Search documents" />
            <div className="noscroll" role="group" aria-label="Filter documents" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={"chip" + (filter === f.key ? " on" : "")}
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  style={{ height: 44, flex: "none", fontSize: 13 }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {shown.length === 0 ? (
              <p className="sub" role="status" style={{ textAlign: "center", padding: "18px 0" }}>
                {needle ? `No documents match “${q.trim()}”.` : "No documents of this kind yet."}
              </p>
            ) : (
              <ListCard key={filter + needle}>
                {shown.map(({ o, kind, ready }, i) => {
                  const m = DOC_META[kind];
                  return (
                    <div
                      key={o.id + kind}
                      className="drow"
                      style={{ animation: "m-rise .45s cubic-bezier(.22,1,.36,1) both", animationDelay: `${Math.min(i, 12) * 0.04}s` }}
                    >
                      <span
                        style={{ width: 36, height: 36, flex: "none", borderRadius: 10, background: ready ? "#FBEBDD" : "#F6F2EB", color: ready ? "#9A4A1F" : "#857C71", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Icon name={ready ? "docs" : "lock"} size={18} />
                      </span>
                      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                        <strong style={{ fontSize: 14, color: ready ? "#1A1714" : "#6E665C" }}>{m.title}</strong>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4A433B", minWidth: 0 }}>
                          <Chip bg={m.colors[0]} fg={m.colors[1]} style={{ height: 20, fontSize: 10, padding: "0 7px" }}>
                            {m.chip}
                          </Chip>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {o.orderNumber} · {ready ? o.requestedLabel : "—"}
                          </span>
                        </span>
                      </span>
                      {ready ? (
                        <Link href={docHref(o.id, kind)} className="icon" aria-label={`Open ${m.title.toLowerCase()} for ${o.orderNumber}`}>
                          <Icon name="download" size={16} stroke={2} />
                        </Link>
                      ) : (
                        <span style={{ fontSize: 11, color: "#4A433B", whiteSpace: "nowrap" }}>{m.locked}</span>
                      )}
                    </div>
                  );
                })}
              </ListCard>
            )}
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#4A433B" }}>
              Open a document to print it or save it as a PDF.
            </p>
          </>
        )}
      </div>
    </LightPage>
  );
}
