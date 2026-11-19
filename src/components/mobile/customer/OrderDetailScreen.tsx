"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { formatNaira } from "@/lib/pricing";
import type { BankDetails } from "@/lib/studio-info";
import { studioWhatsApp } from "@/lib/zenom-mobile";
import { useStudioInfo } from "@/components/StudioInfoProvider";
import { BackBar, Chip, Icon, LightPage, ListCard, NextStepCard, SegTabs, StageTracker, copyText, useLightToast } from "@/components/mobile/ui";
import {
  ACTION_DONE,
  DOC_KINDS,
  DOC_META,
  PHOTO_STAGES,
  PHOTO_STAGE_LABEL,
  balanceOf,
  docHref,
  docReady,
  feedbackPending,
  latestSketch,
  nextStepFor,
  photosOf,
  reached,
  stageOf,
  type CustomerItem,
  type CustomerOrder,
  type NextAction,
  type OrderAction,
  type Phase,
  type PhotoStage,
} from "./model";
import { prettyDate, studioDate } from "./format";
import { PhotoViewerSheet, type ViewerPhoto } from "./PhotoViewerSheet";
import { SketchChangesSheet } from "./SketchChangesSheet";
import { useOrderActions } from "./useOrderActions";

type Tab = "quote" | "payments" | "progress" | "docs";
const TABS: { key: Tab; label: string }[] = [
  { key: "quote", label: "Quote" },
  { key: "payments", label: "Payments" },
  { key: "progress", label: "Progress" },
  { key: "docs", label: "Docs" },
];

const PAID: [string, string] = ["#E3EFE4", "#1F4D24"];
const DUE: [string, string] = ["#FBE0CB", "#6B3214"];
const CHECKING: [string, string] = ["#E4E8F2", "#2E3A5C"];
const LATER: [string, string] = ["#EFEAE2", "#4A433B"];

/** Mobile order detail (/account/orders/[id], below 900px). */
export function OrderDetailScreen({ order, initialTab = "quote" }: { order: CustomerOrder; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const { say } = useLightToast();
  const info = useStudioInfo();
  const { order: o, run, busy } = useOrderActions(order);
  const [error, setError] = useState<{ phase: Phase; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [viewer, setViewer] = useState<{ photos: ViewerPhoto[]; index: number } | null>(null);

  const { step, label } = stageOf(o);
  const nx = nextStepFor(o, info);
  const cancelled = o.status === "CANCELLED";
  const sketch = latestSketch(o);

  const progress = useMemo<ViewerPhoto[]>(
    () => o.photos.map((p) => ({ id: p.id, url: p.url, caption: `${PHOTO_STAGE_LABEL[p.stage]} · ${studioDate(p.createdAt)}` })),
    [o.photos]
  );
  const openProgress = (id: string) => {
    const index = progress.findIndex((p) => p.id === id);
    if (index >= 0) setViewer({ photos: progress, index });
  };
  const openReference = (it: CustomerItem) => {
    if (it.photoUrl) setViewer({ photos: [{ id: it.id, url: it.photoUrl, caption: "Your photo" }], index: 0 });
  };

  /** Posts a tap; resolves the error text ("" when ignored), or null when it went through. */
  const act = async (action: OrderAction, feedback?: string): Promise<string | null> => {
    setError(null);
    const r = await run(action, feedback);
    if (!r) return "";
    if (r.ok) {
      say(ACTION_DONE[action]);
      return null;
    }
    if (action !== "request-changes") setError({ phase: nx.phase, text: r.error });
    return r.error;
  };

  const cardAction = (a?: NextAction) => {
    if (!a?.action) return a;
    if (a.action === "ask-changes") return { label: a.label, onClick: () => !busy && setAsking(true) };
    const action = a.action;
    return { label: a.label, onClick: () => void act(action), loading: busy === action };
  };

  const copyRef = async () => say((await copyText(o.orderNumber)) ? "Reference copied" : `Reference: ${o.orderNumber}`);

  const meta = [o.medium, o.framed ? "Framed" : "Paper only", o.delivery === "KADUNA" ? "Kaduna" : "Outside Kaduna", `Requested ${o.requestedLabel}`]
    .filter(Boolean)
    .join(" · ");

  const body: ReactNode = (
    <>
      {nx.body}
      {nx.extra === "bank" && info.bank && <BankBox bank={info.bank} reference={o.orderNumber} />}
      {nx.extra === "sketch" && sketch && <SketchPeek url={sketch.url} date={studioDate(sketch.createdAt)} onOpen={() => openProgress(sketch.id)} />}
      {nx.extra === "feedback" && o.sketchFeedback && <FeedbackQuote text={o.sketchFeedback} />}
      {error?.phase === nx.phase && (
        <span role="alert" style={{ display: "block", marginTop: 10, color: "#FFB4A6", fontWeight: 600 }}>
          {error.text}
        </span>
      )}
    </>
  );

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

        <NextStepCard title={nx.title} body={body} image={o.image} primary={cardAction(nx.primary)} secondary={cardAction(nx.secondary)} />

        <SegTabs items={TABS} value={tab} onChange={setTab} label="Order details" />

        <div key={tab} className="tabin" role="tabpanel" aria-label={TABS.find((t) => t.key === tab)?.label}>
          {tab === "quote" && <QuotePanel o={o} onPhoto={openReference} />}
          {tab === "payments" && <PaymentsPanel o={o} bank={info.bank} onCopy={copyRef} />}
          {tab === "progress" && <ProgressPanel o={o} onOpen={openProgress} />}
          {tab === "docs" && <DocsPanel o={o} />}
        </div>
      </div>

      <SketchChangesSheet open={asking} onClose={() => setAsking(false)} busy={busy === "request-changes"} onSend={(text) => act("request-changes", text)} />
      <PhotoViewerSheet
        photos={viewer?.photos ?? []}
        index={viewer?.index ?? null}
        onIndex={(index) => setViewer((v) => (v ? { ...v, index } : v))}
        onClose={() => setViewer(null)}
      />
    </LightPage>
  );
}

/* ── Inside the dark next-step card ── */

/** Bank details for the deposit, with Copy on the account number and reference. */
function BankBox({ bank, reference }: { bank: BankDetails; reference: string }) {
  const { say } = useLightToast();
  const copy = async (what: string, value: string) => say((await copyText(value)) ? `${what} copied` : `${what}: ${value}`);
  const rows: [string, string, (() => void)?][] = [
    ["Bank", bank.bank],
    ["Account name", bank.accountName],
    ["Account no.", bank.accountNumber, () => void copy("Account number", bank.accountNumber)],
    ["Reference", reference, () => void copy("Reference", reference)],
  ];
  return (
    <span style={{ display: "flex", flexDirection: "column", marginTop: 12, padding: "2px 14px", borderRadius: 14, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)" }}>
      {rows.map(([k, v, onCopy], i) => (
        <span key={k} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, borderTop: i ? "1px solid rgba(255,255,255,.1)" : 0 }}>
          <span style={{ width: 96, flex: "none", fontSize: 13, color: "#A39B90" }}>{k}</span>
          <strong style={{ flex: 1, minWidth: 0, color: "#ffffff", overflowWrap: "anywhere" }}>{v}</strong>
          {onCopy && (
            <button
              type="button"
              onClick={onCopy}
              aria-label={`Copy ${k === "Reference" ? "reference" : "account number"} ${v}`}
              style={{ border: 0, background: "none", padding: "0 2px", minHeight: 44, font: "600 13px 'Instrument Sans', sans-serif", color: "#E58A52", cursor: "pointer" }}
            >
              Copy
            </button>
          )}
        </span>
      ))}
    </span>
  );
}

function SketchPeek({ url, date, onOpen }: { url: string; date: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ marginTop: 12, width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 8, borderRadius: 14, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.06)", color: "#ffffff", font: "inherit", textAlign: "left", cursor: "pointer" }}
    >
      <span style={{ position: "relative", width: 56, height: 70, borderRadius: 8, overflow: "hidden", flex: "none", background: "#2A2520" }}>
        <Image src={url} alt="" fill sizes="56px" style={{ objectFit: "cover" }} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        <strong style={{ fontSize: 14 }}>See the sketch</strong>
        <span style={{ fontSize: 12, color: "#A39B90" }}>Shared {date}</span>
      </span>
      <Icon name="chevronRight" size={16} stroke={2} style={{ color: "#E58A52", flex: "none" }} />
    </button>
  );
}

function FeedbackQuote({ text }: { text: string }) {
  return (
    <span style={{ display: "block", marginTop: 12, padding: "10px 14px", borderLeft: "3px solid #E58A52", borderRadius: "0 12px 12px 0", background: "rgba(255,255,255,.06)", color: "#ffffff", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
      <span style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#A39B90" }}>Your request</span>
      {text}
    </span>
  );
}

/* ── Tabs ── */

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

function QuotePanel({ o, onPhoto }: { o: CustomerOrder; onPhoto: (it: CustomerItem) => void }) {
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
        ? o.quoteAcceptedAt
          ? "Accepted"
          : "Ready to accept"
        : o.status === "CANCELLED"
          ? "Cancelled"
          : "Accepted",
  ]);
  if (o.neededBy) rows.push(["Needed by", prettyDate(o.neededBy)]);
  if (o.notes) rows.push(["Notes", o.notes]);

  const refs = o.items.filter((it) => it.photoUrl);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Rows rows={rows} />
      {refs.length > 0 && (
        <ListCard>
          {refs.map((it) => (
            <button key={it.id} type="button" className="drow" onClick={() => onPhoto(it)} style={{ minHeight: 56, cursor: "pointer" }}>
              <span style={{ position: "relative", width: 48, height: 60, borderRadius: 8, overflow: "hidden", flex: "none", background: "#EFEAE2" }}>
                <Image src={it.photoUrl as string} alt="" fill sizes="48px" style={{ objectFit: "cover" }} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 14 }}>Your photo</strong>
                <span style={{ fontSize: 12, color: "#4A433B" }}>The reference you sent with your request</span>
              </span>
              <Icon name="chevronRight" size={16} stroke={2} style={{ color: "#9A4A1F", flex: "none" }} />
            </button>
          ))}
        </ListCard>
      )}
    </div>
  );
}

function PaymentsPanel({ o, bank, onCopy }: { o: CustomerOrder; bank: BankDetails | null; onCopy: () => void }) {
  const cancelled = o.status === "CANCELLED";
  const depositState = cancelled
    ? "Cancelled"
    : reached(o.status, "CONFIRMED")
      ? "Paid"
      : o.status === "AWAITING_DEPOSIT"
        ? o.customerPaidAt
          ? "Checking"
          : "Due"
        : "Later";
  const balanceState = cancelled ? "Cancelled" : o.status === "COMPLETED" ? "Paid" : o.status === "READY" ? "Due" : "Later";
  const chip = (s: string) => (s === "Paid" ? PAID : s === "Due" ? DUE : s === "Checking" ? CHECKING : LATER);
  const pay: [string, string, string][] = [
    ["Deposit · 50%", `${formatNaira(o.deposit)} · ${depositState === "Checking" ? "Samuel is checking your transfer" : "starts the drawing"}`, depositState],
    ["Balance", `${formatNaira(balanceOf(o))} · on delivery${o.delivery === "OUTSIDE" ? " (+ delivery)" : ""}`, balanceState],
  ];
  const muted = bank ? undefined : { color: "#6E665C" };

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

      {!bank && !cancelled && (
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
            <dd style={muted}>{bank?.accountName ?? "To confirm"}</dd>
          </div>
          <div className="kv">
            <dt>Bank</dt>
            <dd style={muted}>{bank?.bank ?? "To confirm"}</dd>
          </div>
          <div className="kv">
            <dt>Account no.</dt>
            <dd style={muted}>{bank?.accountNumber ?? "To confirm"}</dd>
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

/** Where each photo stage sits against the order status: before it, now, or done. */
const STAGE_SPAN: Record<PhotoStage, { now: CustomerOrder["status"]; next: CustomerOrder["status"]; waiting: string; locked: string }> = {
  SKETCH: { now: "CONFIRMED", next: "IN_PRODUCTION", waiting: "Samuel is sketching. The sketch shows up here for you to approve.", locked: "After your deposit" },
  SHADING: { now: "IN_PRODUCTION", next: "READY", waiting: "Shading photos show up here as Samuel works.", locked: "After you approve the sketch" },
  FINISHED: { now: "READY", next: "COMPLETED", waiting: "Photos of the finished piece show up here.", locked: "When your piece is finished" },
};

function ProgressPanel({ o, onOpen }: { o: CustomerOrder; onOpen: (id: string) => void }) {
  const cancelled = o.status === "CANCELLED";
  const groups = PHOTO_STAGES.map((g) => ({ ...g, photos: photosOf(o, g.key) })).filter((g) => !cancelled || g.photos.length > 0);

  if (groups.length === 0) {
    return (
      <p className="sub" style={{ fontSize: 14 }}>
        This order was cancelled, so there are no progress photos.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {groups.map((g) => {
        const n = g.photos.length;
        const span = STAGE_SPAN[g.key];
        const past = reached(o.status, span.next);
        // An approved sketch means shading is up next, even before Samuel moves the order on.
        const now = !past && (reached(o.status, span.now) || (g.key === "SHADING" && !!o.sketchApprovedAt && !cancelled));
        const status =
          g.key === "SKETCH" && o.sketchApprovedAt
            ? "Approved"
            : g.key === "SKETCH" && feedbackPending(o)
              ? "Being revised"
              : n
                ? `${n} ${n === 1 ? "photo" : "photos"}`
                : now
                  ? "Coming up"
                  : past
                    ? ""
                    : "Later";
        return (
          <section key={g.key} aria-label={`${g.label} photos`} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{g.label}</h3>
              {status && <span style={{ fontSize: 12, color: status === "Approved" ? "#1F4D24" : "#4A433B", fontWeight: status === "Approved" ? 600 : 400 }}>{status}</span>}
            </div>
            {n > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                {g.photos.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpen(p.id)}
                    aria-label={`${g.label} photo ${i + 1}, shared ${studioDate(p.createdAt)}. View large`}
                    style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 12, overflow: "hidden", background: "#EFEAE2", border: 0, padding: 0, cursor: "pointer" }}
                  >
                    <Image src={p.url} alt="" fill sizes="(max-width: 560px) 33vw, 180px" style={{ objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 14,
                  borderRadius: 14,
                  border: "1px dashed #DCD5CA",
                  background: now ? "#FBEBDD" : "#F6F2EB",
                  color: now ? "#6B3214" : "#4A433B",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                <Icon name={now ? "camera" : past ? "image" : "lock"} size={18} stroke={2} style={{ flex: "none" }} />
                <span>{now ? span.waiting : past ? "No photos shared at this stage." : span.locked}</span>
              </div>
            )}
          </section>
        );
      })}
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#4A433B" }}>
        Samuel shares the sketch and progress photos here as the drawing moves along. Tap a photo to see it large.
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
