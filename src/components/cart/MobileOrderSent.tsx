"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { DrawnMark } from "@/components/storefront-mobile/DrawnMark";
import { WhatsAppIcon } from "@/components/storefront-mobile/icons";
import { SIZES, formatNaira, orderTotals } from "@/lib/pricing";
import type { SentOrder } from "./useSendOrder";

const EASE = "cubic-bezier(.16,1,.3,1)";

// "Order sent" below 900px (reference: Sent / Prototype "sent"): fades in
// with a slight scale (zFadeIn), the mark draws again, then the order card
// and three next steps. Amounts are the server's (falling back to the same
// lib/pricing maths if the response lacked them).
export function MobileOrderSent({ order }: { order: SentOrder }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus({ preventScroll: true }), []);

  const first = order.items[0];
  const more = order.items.length - 1;
  const title = first ? (more > 0 ? `${first.productName} + ${more} more` : first.productName) : `Order ${order.orderNumber}`;
  const where = order.delivery === "kaduna" ? "Kaduna" : "Outside Kaduna";
  const spec = first ? `${SIZES[first.sizeIndex].label} in · ${first.framed ? "Framed" : "Paper only"} · ${where}` : where;
  const fallback = orderTotals(order.items, order.delivery);
  const total = order.total ?? fallback.total;
  const deposit = order.deposit ?? fallback.deposit;
  const opened = !order.whatsappUrl;

  const steps = [
    opened ? "Order sent on WhatsApp" : `Order ${order.orderNumber} saved`,
    "Pay the 50% deposit",
    "Samuel starts drawing",
  ];

  return (
    <section
      aria-labelledby="order-sent-title"
      className="flex min-h-[100svh] flex-col gap-[26px] px-6"
      style={{
        paddingTop: "calc(56px + 40px + env(safe-area-inset-top))",
        paddingBottom: "calc(32px + env(safe-area-inset-bottom))",
        animation: `zFadeIn .6s ${EASE} both`,
      }}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <DrawnMark size={68} stroke={14} drawMs={1300} delayMs={200} popMs={1600} />
        <p className="zk zr text-ember" style={{ animationDelay: ".6s" }}>
          Order {order.orderNumber} sent
        </p>
        <h1
          id="order-sent-title"
          ref={headingRef}
          tabIndex={-1}
          className="zs zr text-[40px] leading-none text-ink outline-none"
          style={{ animationDelay: ".7s" }}
        >
          Thank you.
        </h1>
        <p className="zr max-w-[290px] text-[14px] leading-[1.6] text-ink-2" style={{ animationDelay: ".8s" }}>
          {opened
            ? "Your order opened in WhatsApp. Samuel will confirm the details and send deposit instructions there."
            : "Your order is saved. Open WhatsApp to send it, and Samuel will confirm the details and deposit there."}
        </p>
      </div>

      <div className="zr flex items-center gap-3.5 rounded-[20px] bg-night-raised p-4" style={{ animationDelay: ".9s" }}>
        {first && (
          <span className="relative h-[68px] w-[54px] flex-none overflow-hidden rounded-lg bg-night-hover">
            <Image src={first.imageUrl} alt="" fill sizes="54px" className="object-cover" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[15px] font-medium leading-snug text-ink">{title}</span>
          <span className="text-[12px] text-ink-3">{spec}</span>
        </span>
        <span className="flex flex-none flex-col items-end gap-1">
          <span className="zn text-[20px] leading-none text-ink">
            {formatNaira(total)}
            {order.delivery === "other" ? " +" : ""}
          </span>
          <span className="text-[11px] text-ember">Deposit {formatNaira(deposit)}</span>
        </span>
      </div>

      <ol className="zr m-0 flex list-none flex-col gap-3.5 p-0 text-[14px]" style={{ animationDelay: "1s" }}>
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 ${i === 0 ? "text-ink" : "text-ink-2"}`}>
            {i === 0 ? (
              <span aria-hidden className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-ember text-[11px] font-semibold text-night">
                ✓
              </span>
            ) : (
              <span aria-hidden className="zk flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full border border-ink/25 tracking-normal">
                {i + 1}
              </span>
            )}
            <span>
              {i === 0 && <span className="sr-only">Done: </span>}
              {s}
            </span>
          </li>
        ))}
      </ol>

      <div className="zr mt-auto flex flex-col gap-1.5" style={{ animationDelay: "1.1s" }}>
        {order.whatsappUrl && (
          <a
            href={order.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="zf flex h-[54px] items-center justify-center gap-2.5 rounded-pill bg-ember text-[15px] font-semibold text-night hover:text-night"
          >
            <WhatsAppIcon />
            Open WhatsApp
          </a>
        )}
        <Link
          href="/account/orders"
          className={`zf flex h-[54px] items-center justify-center rounded-pill text-[15px] font-semibold ${
            order.whatsappUrl ? "border border-ink/20 text-ink hover:text-ink" : "bg-ink text-night hover:text-night"
          }`}
        >
          Track my order
        </Link>
        <Link href="/" data-nav="fade" className="zf flex h-12 items-center justify-center rounded-pill text-[14px] text-ink hover:text-ink">
          Back to home
        </Link>
      </div>
    </section>
  );
}
