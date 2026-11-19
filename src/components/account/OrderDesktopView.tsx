"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatNaira } from "@/lib/pricing";
import { buttonClass } from "@/lib/button-class";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useStudioInfo } from "@/components/StudioInfoProvider";
import {
  ACTION_DONE,
  DOC_KINDS,
  DOC_META,
  PHOTO_STAGES,
  docHref,
  docReady,
  feedbackPending,
  latestSketch,
  nextStepFor,
  photosOf,
  reached,
  stageOf,
  type CustomerOrder,
  type NextAction,
  type OrderAction,
  type Phase,
} from "@/components/mobile/customer/model";
import { prettyDate, studioDate } from "@/components/mobile/customer/format";
import { feedbackError, useOrderActions } from "@/components/mobile/customer/useOrderActions";

/**
 * Desktop order page (/account/orders/[id], from 900px up), in the dark
 * site's style. Same next step, buttons and progress photos as the light
 * app's OrderDetailScreen; photos open full size in a new tab.
 */
export function OrderDesktopView({ order }: { order: CustomerOrder }) {
  const info = useStudioInfo();
  const { toast } = useToast();
  const { order: o, run, busy } = useOrderActions(order);
  const [error, setError] = useState<{ phase: Phase; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [feedback, setFeedback] = useState("");

  const nx = nextStepFor(o, info);
  const { label } = stageOf(o);
  const sketch = latestSketch(o);
  const cancelled = o.status === "CANCELLED";

  const act = async (action: OrderAction, text?: string) => {
    setError(null);
    const r = await run(action, text);
    if (!r) return;
    if (!r.ok) return setError({ phase: nx.phase, text: r.error });
    toast(ACTION_DONE[action]);
    if (action === "request-changes") {
      setAsking(false);
      setFeedback("");
    }
  };

  const sendChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const invalid = feedbackError(feedback);
    if (invalid) return setError({ phase: nx.phase, text: invalid });
    void act("request-changes", feedback.trim());
  };

  const renderAction = (a: NextAction | undefined, variant: "ember" | "secondary") => {
    if (!a) return null;
    if (a.action === "ask-changes") {
      return (
        <Button
          type="button"
          variant={variant}
          disabled={!!busy}
          onClick={() => {
            setError(null);
            setAsking(true);
          }}
        >
          {a.label}
        </Button>
      );
    }
    if (a.action) {
      const action = a.action;
      return (
        <Button type="button" variant={variant} loading={busy === action} disabled={!!busy && busy !== action} onClick={() => void act(action)}>
          {a.label}
        </Button>
      );
    }
    if (!a.href) return null;
    return a.external ? (
      <a href={a.href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant)}>
        {a.label}
      </a>
    ) : (
      <Link href={a.href} className={buttonClass(variant)}>
        {a.label}
      </Link>
    );
  };

  const depositNote = cancelled
    ? ""
    : reached(o.status, "CONFIRMED")
      ? " · received"
      : o.customerPaidAt
        ? " · transfer sent, Samuel is checking it"
        : "";
  const showPhotos = o.photos.length > 0 || reached(o.status, "CONFIRMED");
  const readyDocs = DOC_KINDS.filter((k) => docReady(o.status, k));

  return (
    <>
      <h1 className="font-display text-3xl text-ink">{o.orderNumber}</h1>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ember">{label}</p>

      <section aria-labelledby="next-step-title" className="mt-8 rounded-card bg-night-raised p-6">
        <p className="kicker">Your next step</p>
        <h2 id="next-step-title" className="mt-3 font-display text-2xl italic text-ink">
          {nx.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{nx.body}</p>

        {nx.extra === "bank" && info.bank && (
          <dl className="mt-4 grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-tile border border-ink/10 px-4 py-3 text-sm">
            <dt className="text-ink-3">Bank</dt>
            <dd className="text-ink">{info.bank.bank}</dd>
            <dt className="text-ink-3">Account name</dt>
            <dd className="text-ink">{info.bank.accountName}</dd>
            <dt className="text-ink-3">Account no.</dt>
            <dd className="font-semibold tracking-wide text-ink">{info.bank.accountNumber}</dd>
            <dt className="text-ink-3">Reference</dt>
            <dd className="font-semibold text-ink">{o.orderNumber}</dd>
          </dl>
        )}

        {nx.extra === "sketch" && sketch && (
          <a
            href={sketch.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-4 rounded-tile border border-ink/10 p-3 transition-colors hover:border-ember"
          >
            <span className="relative h-[100px] w-[80px] flex-none overflow-hidden rounded-[10px] bg-night-hover">
              <Image src={sketch.url} alt="" fill sizes="80px" className="object-cover" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">See the sketch full size</span>
              <span className="mt-0.5 block text-[13px] text-ink-3">Shared {studioDate(sketch.createdAt)} · opens in a new tab</span>
            </span>
          </a>
        )}

        {nx.extra === "feedback" && o.sketchFeedback && (
          <blockquote className="mt-4 whitespace-pre-wrap break-words border-l-2 border-ember pl-4 text-sm text-ink">
            <span className="mb-1 block text-[12px] text-ink-3">Your request</span>
            {o.sketchFeedback}
          </blockquote>
        )}

        {asking ? (
          <form onSubmit={sendChanges} noValidate className="mt-5 space-y-3">
            <label htmlFor="sketch-changes-desktop" className="block text-sm font-semibold text-ink">
              What would you like Samuel to change?
            </label>
            <textarea
              id="sketch-changes-desktop"
              className="field min-h-[110px] resize-y leading-relaxed"
              rows={4}
              maxLength={1000}
              placeholder="For example: make the smile a little softer, and add my mum's earrings."
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                setError(null);
              }}
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="ember" loading={busy === "request-changes"}>
                Send to Samuel
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy === "request-changes"}
                onClick={() => {
                  setAsking(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          (nx.primary || nx.secondary) && (
            <div className="mt-5 flex flex-wrap gap-3">
              {renderAction(nx.primary, "ember")}
              {renderAction(nx.secondary, "secondary")}
            </div>
          )
        )}

        {error?.phase === nx.phase && (
          <p role="alert" className="mt-3 text-sm text-[#F4A896]">
            {error.text}
          </p>
        )}
      </section>

      <ul className="mt-8 space-y-4">
        {o.items.map((item) => (
          <li key={item.id} className="flex gap-4 border-b border-ink/10 pb-4">
            {item.photoUrl && (
              <a
                href={item.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Your reference photo, opens full size in a new tab"
                className="relative block h-[70px] w-[56px] flex-none overflow-hidden rounded-[10px] bg-night-hover"
              >
                <Image src={item.photoUrl} alt="" fill sizes="56px" className="object-cover" />
              </a>
            )}
            <div className="min-w-0">
              <p className="font-medium text-ink">{item.title}</p>
              <p className="text-sm text-ink-2">
                {item.size ?? "—"} in · {item.framed ? "framed" : "unframed"}
                {item.subjectCount > 1 ? ` · ${item.subjectCount} subjects` : ""}
                {item.medium ? ` · ${item.medium}` : ""} · {formatNaira(item.unitPrice)}
              </p>
              {item.photoUrl && <p className="mt-0.5 text-[13px] text-ink-3">With your reference photo</p>}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-1 text-sm text-ink-2">
        {o.neededBy && <p>Needed by: {prettyDate(o.neededBy)}</p>}
        {o.notes && <p className="whitespace-pre-wrap break-words">Notes: {o.notes}</p>}
        <p>Delivery: {o.deliveryAddress || "To confirm on WhatsApp"}</p>
        <p>{o.delivery === "KADUNA" ? `Delivery within Kaduna: ${formatNaira(o.deliveryFee)}` : "Delivery outside Kaduna: quoted on WhatsApp"}</p>
        <p className="text-ink">Total: {formatNaira(o.total)}</p>
        <p>
          50% deposit to begin: {formatNaira(o.deposit)}
          {depositNote}
        </p>
      </div>

      {showPhotos && (
        <section aria-labelledby="progress-title" className="mt-12">
          <h2 id="progress-title" className="label-mono">
            Progress photos
          </h2>
          <p className="mt-2 text-sm text-ink-3">Samuel shares the sketch and progress photos here as the drawing moves along. Click a photo to see it full size.</p>
          <div className="mt-5 space-y-6">
            {PHOTO_STAGES.map((g) => {
              const photos = photosOf(o, g.key);
              if (cancelled && photos.length === 0) return null;
              const note =
                g.key === "SKETCH" && o.sketchApprovedAt ? "Approved" : g.key === "SKETCH" && feedbackPending(o) ? "Being revised" : "";
              return (
                <div key={g.key}>
                  <p className="text-sm font-semibold text-ink">
                    {g.label}
                    {note && <span className="ml-2 text-[12px] font-normal text-ember">{note}</span>}
                  </p>
                  {photos.length === 0 ? (
                    <p className="mt-1 text-[13px] text-ink-3">Not shared yet.</p>
                  ) : (
                    <ul className="mt-2 grid grid-cols-4 gap-3">
                      {photos.map((p, i) => (
                        <li key={p.id}>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${g.label} photo ${i + 1}, shared ${studioDate(p.createdAt)}. Opens full size in a new tab`}
                            className="group relative block aspect-[4/5] overflow-hidden rounded-tile bg-night-hover"
                          >
                            <Image src={p.url} alt="" fill sizes="160px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {readyDocs.length > 0 && (
        <section aria-labelledby="documents-title" className="mt-12">
          <h2 id="documents-title" className="label-mono">
            Documents
          </h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {readyDocs.map((kind) => (
              <li key={kind}>
                <Link href={docHref(o.id, kind)} className={buttonClass("secondary", "px-5 py-2.5 text-[13px]")}>
                  {DOC_META[kind].title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
