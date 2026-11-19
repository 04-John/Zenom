"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatNaira } from "@/lib/pricing";
import { BANK_DETAILS, studioWhatsApp } from "@/lib/zenom-mobile";
import { BackBar, Chip, Icon, LightPage, ListCard, NextStepCard, SegTabs, StageTracker, copyText, useLightToast } from "@/components/mobile/ui";
import {
  DOC_KINDS,
  DOC_META,
  balanceOf,
  docHref,
  docReady,
  nextStepFor,
  reached,
  stageOf,
  type CustomerOrder,
} from "./model";
import { prettyDate } from "./format";

type Tab = "quote" | "payments" | "progress" | "docs";
const TABS: { key: Tab; label: string }[] = [
  { key: "quote", label: "Quote" },
  { key: "payments", label: "Payments" },
  { key: "progress", label: "Progress" },
  { key: "docs", label: "Docs" },
];

const PAID: [string, string] = ["#E3EFE4", "#1F4D24"];
const DUE: [string, string] = ["#FBE0CB", "#6B3214"];
const LATER: [string, string] = ["#EFEAE2", "#4A433B"];

/** Mobile order detail (/account/orders/[id], below 900px). */
export function OrderDetailScreen({ order: o, initialTab = "quote" }: { order: CustomerOrder; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const { say } = useLightToast();
  const { step, label } = stageOf(o.status);
  const nx = nextStepFor(o);
  const cancelled = o.status === "CANCELLED";

  const meta = [o.medium, o.framed ? "Framed" : "Paper only", o.delivery === "KADUNA" ? "Kaduna" : "Outside Kaduna", `Requested ${o.requestedLabel}`]
    .filter(Boolean)
    .join(" · ");

  const copyRef = async () => say((await copyText(o.orderNumber)) ? "Reference copied" : `Reference: ${o.orderNumber}`);

  return (
    <LightPage desktop="hide">
      <div className="enter-fwd" style={{ padding: "0 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        <BackBar href="/account/orders" label="Orders" right={<strong style={{ fontSize: 15 }}>{o.orderNumber}</strong>} />

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Image
            className="artin"
            src={o.image}
            alt={o.title}
            width={128}
            height={160}
            sizes="64px"
            priority
            style={{ width: 64, height: 80, objectFit: "cover", borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,.18)", flex: "none" }}
          />
          <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 12, color: "#4A433B" }}>{meta}</span>
            <h1 className="h1" style={{ fontSize: 26 }}>
              {o.title}
              {o.size ? ` · ${o.size}` : ""}
            </h1>
          </span>
        </div>

        {cancelled ? (
          <div role="status" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 16, background: "#F6DAD7", color: "#8A1F14", fontSize: 14 }}>
            <Icon name="close" size={16} stroke={2.4} />
            <span>
              <strong>Cancelled</strong> · updated {o.updatedAgo.toLowerCase()}
            </span>
          </div>
        ) : (
          <StageTracker current={step} complete={o.status === "COMPLETED"} caption={[`Stage ${step} of 6`, label]} />
        )}

        <NextStepCard title={nx.title} body={nx.body} image={o.image} primary={nx.primary} secondary={nx.secondary} />

        <SegTabs items={TABS} value={tab} onChange={setTab} label="Order details" />

        <div key={tab} className="tabin" role="tabpanel" aria-label={TABS.find((t) => t.key === tab)?.label}>
          {tab === "quote" && <QuotePanel o={o} />}
          {tab === "payments" && <PaymentsPanel o={o} onCopy={copyRef} />}
          {tab === "progress" && <ProgressPanel o={o} />}
          {tab === "docs" && <DocsPanel o={o} />}
        </div>
      </div>
    </LightPage>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ background: "#ffffff", border: "1px solid #E8E2D8", borderRadius: 18, padding: "2px 16px" }}>
      <dl style={{ margin: 0 }}>
        {rows.map(([k, v]) => (
          <div className="kv" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function QuotePanel({ o }: { o: CustomerOrder }) {
  const rows: [string, string][] = [];
  const only = o.items.length === 1 ? o.items[0] : null;
  if (only?.breakdown) {
    const b = only.breakdown;
    rows.push(["Artwork", `${formatNaira(b.artwork)}${only.size ? ` · ${only.size} in` : ""}`]);
    rows.push(["Framing", only.framed ? formatNaira(b.framing) : "Paper only"]);
    if (only.category === "portrait") rows.push(["Extra people", b.extra ? `${formatNaira(b.extra)} · ${only.subjectCount} people` : "—"]);
  } else {
    o.items.forEach((it, i) => {
      const spec = [it.title, it.size && `${it.size} in`, it.framed ? "Framed" : "Paper only", it.subjectCount > 1 && `${it.subjectCount} people`, formatNaira(it.unitPrice)]
        .filter(Boolean)
        .join(" · ");
      rows.push([o.items.length > 1 ? `Piece ${i + 1}` : "Artwork", spec]);
    });
  }
  if (o.medium) rows.push(["Medium", o.medium]);
  rows.push(["Delivery", o.delivery === "KADUNA" ? `${formatNaira(o.deliveryFee)} · Kaduna` : "Outside Kaduna · quoted on WhatsApp"]);
  rows.push([
    "Total",
    `${formatNaira(o.total)}${o.delivery === "OUTSIDE" ? " + delivery" : ""}${o.status === "PENDING" ? " · estimate" : ""}`,
  ]);
  rows.push([
    "Quote",
    o.status === "PENDING"
      ? "Being prepared"
      : o.status === "AWAITING_DEPOSIT"
        ? "Ready · reply on WhatsApp"
        : o.status === "CANCELLED"
          ? "Cancelled"
          : "Accepted",
  ]);
  if (o.neededBy) rows.push(["Needed by", prettyDate(o.neededBy)]);
  if (o.notes) rows.push(["Notes", o.notes]);
  return <Rows rows={rows} />;
}

function PaymentsPanel({ o, onCopy }: { o: CustomerOrder; onCopy: () => void }) {
  const cancelled = o.status === "CANCELLED";
  const depositState = cancelled ? "Cancelled" : reached(o.status, "CONFIRMED") ? "Paid" : o.status === "AWAITING_DEPOSIT" ? "Due" : "Later";
  const balanceState = cancelled ? "Cancelled" : o.status === "COMPLETED" ? "Paid" : o.status === "READY" ? "Due" : "Later";
  const chip = (s: string) => (s === "Paid" ? PAID : s === "Due" ? DUE : LATER);
  const pay: [string, string, string][] = [
    ["Deposit · 50%", `${formatNaira(o.deposit)} · starts the drawing`, depositState],
    ["Balance", `${formatNaira(balanceOf(o))} · on delivery${o.delivery === "OUTSIDE" ? " (+ delivery)" : ""}`, balanceState],
  ];
  const placeholder = BANK_DETAILS.placeholder;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {pay.map(([k, v, s]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#ffffff", border: "1px solid #E8E2D8", borderRadius: 16 }}>
          <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <strong style={{ fontSize: 14 }}>{k}</strong>
            <span style={{ fontSize: 12, color: "#4A433B" }}>{v}</span>
          </span>
          <Chip bg={chip(s)[0]} fg={chip(s)[1]}>
            {s}
          </Chip>
        </div>
      ))}

      {placeholder && !cancelled && (
        <div style={{ display: "flex", gap: 10, padding: 14, borderRadius: 16, background: "#FBEBDD", color: "#4A2410", fontSize: 13, lineHeight: 1.5 }}>
          <Icon d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 8v5", "M12 16h.01"]} size={18} stroke={2} style={{ color: "#9A4A1F", flex: "none", marginTop: 1 }} />
          <span>
            Bank details are to confirm: Samuel sends them with your quote on WhatsApp. Please don&apos;t transfer until you have them.{" "}
            <a
              href={studioWhatsApp(`Hello Samuel, please send the bank details for ${o.orderNumber}.`)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#9A4A1F", fontWeight: 600 }}
            >
              Ask for them
            </a>
          </span>
        </div>
      )}

      <div style={{ background: "#ffffff", border: "1px solid #E8E2D8", borderRadius: 16, padding: "2px 16px" }}>
        <dl style={{ margin: 0 }}>
          <div className="kv">
            <dt>Account name</dt>
            <dd>{BANK_DETAILS.accountName}</dd>
          </div>
          <div className="kv">
            <dt>Bank</dt>
            <dd style={placeholder ? { color: "#6E665C" } : undefined}>{placeholder ? "To confirm" : BANK_DETAILS.bank}</dd>
          </div>
          <div className="kv">
            <dt>Account no.</dt>
            <dd style={placeholder ? { color: "#6E665C" } : undefined}>{placeholder ? "To confirm" : BANK_DETAILS.accountNumber}</dd>
          </div>
          <div className="kv" style={{ alignItems: "center" }}>
            <dt>Reference</dt>
            <dd style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              {o.orderNumber}
              <button type="button" className="lnk" onClick={onCopy} style={{ padding: "8px 4px", minHeight: 44 }} aria-label={`Copy reference ${o.orderNumber}`}>
                Copy
              </button>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function ProgressPanel({ o }: { o: CustomerOrder }) {
  const shots: [string, boolean][] = [
    ["Sketch", reached(o.status, "CONFIRMED")],
    ["Shading", reached(o.status, "IN_PRODUCTION")],
    ["Finished", reached(o.status, "READY")],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        {shots.map(([name, open]) => (
          <div key={name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 12, overflow: "hidden", background: "#EFEAE2" }}>
              {open ? (
                <span style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 8, textAlign: "center", background: "#FBEBDD", color: "#9A4A1F", fontSize: 11, fontWeight: 600 }}>
                  <Icon name="whatsapp" size={20} />
                  On WhatsApp
                </span>
              ) : (
                <>
                  <Image src={o.image} alt="" fill sizes="120px" style={{ objectFit: "cover", filter: "blur(6px) grayscale(1)", opacity: 0.5 }} />
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,234,226,.85)", color: "#4A433B" }}>
                    <Icon name="lock" size={18} stroke={2} />
                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Locked</span>
                  </span>
                </>
              )}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#4A433B" }}>
        Samuel shares the sketch and progress photos with you on WhatsApp as the drawing moves along.
      </p>
    </div>
  );
}

function DocsPanel({ o }: { o: CustomerOrder }) {
  return (
    <ListCard>
      {DOC_KINDS.map((kind) => {
        const m = DOC_META[kind];
        const ready = docReady(o.status, kind);
        const inner = (
          <>
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <strong style={{ fontSize: 14, color: ready ? "#1A1714" : "#6E665C" }}>{m.title}</strong>
              <span style={{ fontSize: 12, color: "#4A433B" }}>{o.orderNumber}</span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: ready ? "#9A4A1F" : "#4A433B", display: "flex", alignItems: "center", gap: 4 }}>
              {ready ? (
                <>
                  Open <Icon name="chevronRight" size={14} stroke={2} />
                </>
              ) : o.status === "CANCELLED" ? (
                "—"
              ) : (
                m.locked
              )}
            </span>
          </>
        );
        return ready ? (
          <Link key={kind} href={docHref(o.id, kind)} className="drow" style={{ minHeight: 56 }}>
            {inner}
          </Link>
        ) : (
          <div key={kind} className="drow" style={{ minHeight: 56 }}>
            {inner}
          </div>
        );
      })}
    </ListCard>
  );
}
