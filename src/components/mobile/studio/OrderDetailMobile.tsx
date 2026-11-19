"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BackBar, Icon, LightPage, ListCard, NextStepCard, StageTracker, useLightToast } from "@/components/mobile/ui";
import { ADMIN_NEXT_STEP, ORDER_FLOW, ORDER_LABEL, type OrderStatus } from "@/lib/zenom-mobile";
import { ConfirmSheet } from "./ConfirmSheet";
import { ORDERS_BACK_KEY, useBackHref } from "./shared";
import { OrderStatusChip } from "./StatusChip";
import { Thumb, canOptimize } from "./Thumb";

export type OrderDetailView = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customer: string;
  first: string;
  placed: string;
  nextBody: string;
  whatsappHref: string | null;
  pieces: { key: string; name: string; image: string | null; spec: string; price: string; extra: string[]; photoUrl?: string }[];
  money: { k: string; v: string }[];
  contact: { name: string; phone: string; email: string; address: string };
  notes: string;
};

const CANCELLABLE: OrderStatus[] = ["PENDING", "AWAITING_DEPOSIT", "CONFIRMED"];

// Order detail in the light studio app: tracker, the dark "Your next step"
// card (moves the status forward via PATCH /api/orders/[id]), WhatsApp,
// pieces, money, customer and a confirm sheet for cancelling.
export function OrderDetailMobile({ o, back }: { o: OrderDetailView; back: { href: string; label: string } }) {
  const router = useRouter();
  const { say } = useLightToast();
  const [busy, setBusy] = useState<"next" | "cancel" | null>(null);
  const [, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const backHref = useBackHref(back.href, ORDERS_BACK_KEY, "/studio/orders");

  const step = ADMIN_NEXT_STEP[o.status];
  const flowIdx = ORDER_FLOW.indexOf(o.status);
  const cover = o.pieces.find((p) => canOptimize(p.image))?.image ?? null;

  async function setStatus(next: OrderStatus, kind: "next" | "cancel", toast: string) {
    setBusy(kind);
    try {
      const res = await fetch(`/api/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      // The API emails the customer when an order moves forward (if they gave an email).
      const { emailed } = (await res.json().catch(() => ({}))) as { emailed?: boolean };
      setCancelOpen(false);
      say(emailed ? `${toast} · customer emailed` : toast);
      // The spinner stays until the refreshed order arrives (both updates commit together).
      startTransition(() => {
        setBusy(null);
        router.refresh();
      });
    } catch {
      setBusy(null);
      say("Couldn't update this order. Try again.", { tone: "error" });
    }
  }

  return (
    <LightPage desktop="hide">
      <div className="enter-fwd" style={{ padding: "0 20px calc(32px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", gap: 16 }}>
        <BackBar
          href={backHref}
          label={back.label}
          right={
            <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span aria-hidden="true" />
              <strong style={{ fontSize: 15 }}>{o.orderNumber}</strong>
              <OrderStatusChip status={o.status} size="sm" />
            </span>
          }
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#4A433B" }}>{o.placed}</span>
          <h1 className="h1" style={{ fontSize: 28, overflowWrap: "anywhere" }}>
            {o.customer}
          </h1>
        </div>

        {o.status === "CANCELLED" ? (
          <div role="status" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "#F6DAD7", color: "#8A1F14", fontSize: 13, fontWeight: 600 }}>
            <Icon name="close" size={16} stroke={2.4} />
            Cancelled. This order is closed.
          </div>
        ) : (
          <StageTracker
            current={flowIdx + 1}
            complete={o.status === "COMPLETED"}
            caption={[`Step ${flowIdx + 1} of 6`, ORDER_LABEL[o.status]]}
          />
        )}

        <NextStepCard
          key={o.status}
          title={step.title}
          body={o.nextBody}
          image={cover}
          primary={step.next && step.cta ? { label: step.cta, loading: busy === "next", onClick: () => setStatus(step.next!, "next", step.toast ?? "Status updated") } : undefined}
          secondary={o.whatsappHref ? { label: `Message ${o.first} on WhatsApp`, href: o.whatsappHref, external: true } : undefined}
        />

        <div className="grp">
          <p className="gh">Pieces</p>
          <ListCard>
            {o.pieces.map((p) => (
              <div key={p.key} className="drow" style={{ alignItems: "flex-start" }}>
                <Thumb src={p.image} w={48} h={60} />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <strong style={{ fontSize: 15 }}>{p.name}</strong>
                  <span style={{ fontSize: 12, color: "#4A433B" }}>{p.spec}</span>
                  {p.extra.map((x) => (
                    <span key={x} style={{ fontSize: 12, color: "#4A433B" }}>
                      {x}
                    </span>
                  ))}
                  {p.photoUrl && (
                    <a href={p.photoUrl} target="_blank" rel="noopener noreferrer" className="lnk" style={{ padding: "12px 0", margin: "-6px 0", alignSelf: "flex-start", fontSize: 13 }}>
                      Open the reference photo
                    </a>
                  )}
                </span>
                <strong style={{ fontSize: 14, flex: "none" }}>{p.price}</strong>
              </div>
            ))}
          </ListCard>
        </div>

        <div className="grp">
          <p className="gh">Money</p>
          <div className="gl">
            <dl style={{ margin: 0 }}>
              {o.money.map((m) => (
                <div key={m.k} className="kv">
                  <dt>{m.k}</dt>
                  <dd>{m.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="grp">
          <p className="gh">Customer</p>
          <div className="gl">
            <dl style={{ margin: 0 }}>
              <div className="kv">
                <dt>Name</dt>
                <dd>{o.contact.name}</dd>
              </div>
              <div className="kv">
                <dt>WhatsApp</dt>
                <dd>
                  {o.contact.phone ? (
                    <a href={`tel:${o.contact.phone.replace(/[^\d+]/g, "")}`} style={{ color: "#9A4A1F" }}>
                      {o.contact.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="kv">
                <dt>Email</dt>
                <dd>
                  {o.contact.email ? (
                    <a href={`mailto:${o.contact.email}`} style={{ color: "#9A4A1F" }}>
                      {o.contact.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="kv">
                <dt>Address</dt>
                <dd>{o.contact.address || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>

        {o.notes && (
          <div className="grp">
            <p className="gh">Notes</p>
            <div className="gl" style={{ padding: "12px 16px", fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {o.notes}
            </div>
          </div>
        )}

        {CANCELLABLE.includes(o.status) && (
          <button type="button" className="sec danger" onClick={() => setCancelOpen(true)}>
            Cancel order
          </button>
        )}
      </div>

      <ConfirmSheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={`Cancel ${o.orderNumber}?`}
        body={`Let ${o.first} know on WhatsApp. If a deposit was paid, it stays non-refundable.`}
        cta="Cancel order"
        busy={busy === "cancel"}
        onConfirm={() => setStatus("CANCELLED", "cancel", `${o.orderNumber} cancelled`)}
      />
    </LightPage>
  );
}
