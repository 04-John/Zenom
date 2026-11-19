"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import type { CustomerOrder, OrderAction, OrderFlags } from "./model";

export type ActionResult = { ok: true } | { ok: false; error: string };

const FALLBACK_ERROR = "Something went wrong. Please try again.";

const textOrNull = (v: unknown) => (typeof v === "string" && v ? v : null);

/**
 * The customer's buttons on their order (mobile and desktop): Accept quote,
 * I've made the transfer, Approve sketch, Ask for changes. Posts to
 * POST /api/account/orders/[id], shows the saved flags straight away (laid
 * over the server's order until the refreshed page arrives) and refreshes
 * the route so the action badge, notifications and order list catch up.
 * Callers show the toast; `run` resolves null when a tap is already posting.
 */
export function useOrderActions(order: CustomerOrder) {
  const router = useRouter();
  const [saved, setSaved] = useState<{ base: CustomerOrder; flags: OrderFlags } | null>(null);
  const [busy, setBusy] = useState<OrderAction | null>(null);
  const [, startTransition] = useTransition();
  const posting = useRef(false);

  // Fresh props from the server (router.refresh / auto-refresh) win again.
  const view: CustomerOrder = saved && saved.base === order ? { ...order, ...saved.flags } : order;

  const run = useCallback(
    async (action: OrderAction, feedback?: string): Promise<ActionResult | null> => {
      if (posting.current) return null;
      posting.current = true;
      setBusy(action);
      try {
        const res = await fetch(`/api/account/orders/${encodeURIComponent(order.id)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action === "request-changes" ? { action, feedback } : { action }),
        });
        const body: Record<string, unknown> | null = await res.json().catch(() => null);
        if (!res.ok) {
          // 409: the order moved on (e.g. Samuel confirmed the deposit). Catch up.
          if (res.status === 409) startTransition(() => router.refresh());
          return { ok: false, error: typeof body?.error === "string" && body.error ? body.error : FALLBACK_ERROR };
        }
        if (body) {
          setSaved({
            base: order,
            flags: {
              quoteAcceptedAt: textOrNull(body.quoteAcceptedAt),
              customerPaidAt: textOrNull(body.customerPaidAt),
              sketchApprovedAt: textOrNull(body.sketchApprovedAt),
              sketchFeedback: textOrNull(body.sketchFeedback),
              sketchFeedbackAt: textOrNull(body.sketchFeedbackAt),
            },
          });
        }
        startTransition(() => router.refresh());
        return { ok: true };
      } catch {
        return { ok: false, error: "We couldn't reach the studio. Check your connection and try again." };
      } finally {
        posting.current = false;
        setBusy(null);
      }
    },
    [order, router]
  );

  return { order: view, run, busy };
}

/** "Ask for changes" text check, matching the API (3 to 1000 characters). */
export function feedbackError(text: string): string | null {
  const t = text.trim();
  if (t.length < 3) return "Please write a few words about the changes you'd like.";
  if (t.length > 1000) return "Please keep it under 1000 characters.";
  return null;
}
