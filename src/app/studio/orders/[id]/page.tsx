import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/pricing";
import { isCommissionSlug, isoDay, mediumLabel } from "@/lib/commission";
import { changesPending, saysPaid } from "@/lib/order-flags";
import { pieceImage } from "@/lib/studio-stats";
import { ORDER_FLOW, ago, customerWhatsApp, fmtDate } from "@/lib/zenom-mobile";
import { OrderDetailMobile, type OrderDetailView } from "@/components/mobile/studio/OrderDetailMobile";
import { StatusBadge } from "../../StatusBadge";
import { OrderStatusForm } from "./OrderStatusForm";
import { ProgressPhotos } from "./ProgressPhotos";

const INCLUDE = {
  items: { include: { product: { include: { images: { orderBy: { order: "asc" }, take: 1 } } } } },
  photos: { orderBy: { createdAt: "asc" }, select: { id: true, stage: true, url: true, createdAt: true } },
} satisfies Prisma.OrderInclude;
type FullOrder = Prisma.OrderGetPayload<{ include: typeof INCLUDE }>;

export default async function StudioOrderDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { from?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: INCLUDE });
  if (!order) notFound();

  const view = toView(order);

  return (
    <>
      {/* Light studio app below 900px. */}
      <OrderDetailMobile
        o={view}
        back={searchParams.from === "overview" ? { href: "/studio", label: "Overview" } : { href: "/studio/orders", label: "Orders" }}
      />
      <div className="max-w-2xl pb-24 pt-8 max-[900px]:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="h-section break-all">{order.orderNumber}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-4 break-words text-sm text-ink-2">
          {order.customerName} · {order.customerPhone} · {order.customerEmail}
        </p>
        <p className="mt-1 text-sm text-ink-2">{order.deliveryAddress}</p>
        {view.neededBy && <p className="mt-1 text-sm font-medium text-ink">Needed by {view.neededBy}</p>}

        {view.alert && (
          <div role="status" className="mt-8 rounded-tile border border-ember/50 bg-ember/10 px-5 py-4 text-sm text-ink">
            <strong>{view.alert.title}</strong> {view.alert.body}
            {view.alert.quote && <p className="mt-2 whitespace-pre-wrap break-words italic text-ink">&ldquo;{view.alert.quote}&rdquo;</p>}
            {view.alert.when && <p className="mt-2 text-xs text-ink-3">{view.alert.when}</p>}
          </div>
        )}

        <OrderStatusForm orderId={order.id} currentStatus={order.status} />

        {view.updates.length > 0 && (
          <section className="mt-8 rounded-card border border-ink/10 bg-night-raised p-6">
            <h2 className="label-mono">From the customer</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {view.updates.map((u) => (
                <div key={u.k} className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                  <dt className="text-ink-2">{u.k}</dt>
                  <dd className="text-right text-ink">{u.v}</dd>
                  {u.quote && <dd className="basis-full whitespace-pre-wrap break-words italic text-ink-2">&ldquo;{u.quote}&rdquo;</dd>}
                </div>
              ))}
            </dl>
          </section>
        )}

        <ul className="mt-8 space-y-3">
          {order.items.map((item) => {
            const medium = mediumLabel(item.medium);
            return (
              <li key={item.id} className="rounded-tile border border-ink/10 bg-night-raised p-4 text-sm text-ink">
                <span className="font-medium">{item.product.name}</span>
                {item.product.archiveCode ? ` (${item.product.archiveCode})` : ""} — {item.sizeLabel ?? "size n/a"} in
                {" — "}
                {item.framed ? "framed" : "unframed"}
                {item.subjectCount > 1 ? ` — ${item.subjectCount} subjects` : ""} — {formatNaira(item.unitPrice)}
                {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                {(medium || item.referencePhotoUrl) && (
                  <p className="mt-1 text-ink-2">
                    {medium}
                    {medium && item.referencePhotoUrl ? " · " : ""}
                    {item.referencePhotoUrl && (
                      <a href={item.referencePhotoUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ember">
                        Open the reference photo
                      </a>
                    )}
                  </p>
                )}
                {item.notes && <p className="mt-1 whitespace-pre-wrap break-words text-ink-2">Note: {item.notes}</p>}
              </li>
            );
          })}
        </ul>

        <ProgressPhotos orderId={order.id} status={order.status} first={view.first} hasAccount={view.hasAccount} photos={view.photos} />

        <dl className="mt-8 space-y-2 rounded-card border border-ink/10 bg-night-raised p-6 text-sm text-ink-2">
          <div className="flex justify-between gap-4">
            <dt>Subtotal</dt>
            <dd>{formatNaira(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Delivery ({order.delivery === "KADUNA" ? "Kaduna" : "Outside Kaduna — quote on WhatsApp"})</dt>
            <dd>{order.delivery === "KADUNA" ? formatNaira(order.deliveryFee) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 font-medium text-ink">
            <dt>Total</dt>
            <dd>{formatNaira(order.total)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>50% deposit</dt>
            <dd>{formatNaira(order.deposit)}</dd>
          </div>
        </dl>

        {view.notes && (
          <section className="mt-8 rounded-card border border-ink/10 bg-night-raised p-6">
            <h2 className="label-mono">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm text-ink">{view.notes}</p>
          </section>
        )}
      </div>
    </>
  );
}

/** "today", "yesterday", "3 days ago", "on 12 Nov" (for "Tapped …"). */
function whenText(d: Date, now: number): string {
  const a = ago(d, now);
  if (a === "Today" || a === "Yesterday") return a.toLowerCase();
  if (/^\d+d ago$/.test(a)) {
    const n = parseInt(a, 10);
    return `${n} ${n === 1 ? "day" : "days"} ago`;
  }
  return `on ${a}`;
}

/** Everything the phone layout shows, as display strings (money from the saved order, in kobo). */
function toView(order: FullOrder): OrderDetailView {
  const now = Date.now();
  const first = order.customerName.trim().split(/\s+/)[0] || order.customerName;
  const total = formatNaira(order.total);
  const deposit = formatNaira(order.deposit);
  const balance = formatNaira(order.total - order.deposit);
  const kaduna = order.delivery === "KADUNA";
  const commission = order.items.some((it) => isCommissionSlug(it.product.slug));
  const pieceCount = order.items.reduce((a, it) => a + (it.quantity || 1), 0);
  const anyFramed = order.items.some((it) => it.framed);
  const flowIdx = ORDER_FLOW.indexOf(order.status);
  const cancelled = order.status === "CANCELLED";
  const neededIso = isoDay(order.neededBy);
  const neededBy = neededIso ? fmtDate(neededIso + "T12:00:00") : null;
  const hasAccount = !!order.userId;

  // The customer's taps (flags only; Samuel still moves the status himself).
  const sketches = order.photos.filter((p) => p.stage === "SKETCH");
  const latestSketchAt = sketches.length ? sketches[sketches.length - 1].createdAt : null;
  const pendingChanges = changesPending(order, latestSketchAt);
  const approved = !!order.sketchApprovedAt;

  let alert: OrderDetailView["alert"] = null;
  if (saysPaid(order)) {
    alert = {
      kind: "says-paid",
      title: "Customer says they've paid.",
      body: "Check your bank, then mark the deposit received.",
      when: `Tapped ${whenText(order.customerPaidAt!, now)}. Look for ${deposit} with reference ${order.orderNumber}.`,
    };
  } else if (pendingChanges) {
    alert = {
      kind: "changes-asked",
      title: "Changes requested.",
      body: "Add the new sketch below when it's ready.",
      quote: order.sketchFeedback ?? undefined,
      when: `Asked ${whenText(order.sketchFeedbackAt!, now)}.`,
    };
  } else if (approved && order.status === "CONFIRMED") {
    alert = {
      kind: "sketch-approved",
      title: "Sketch approved.",
      body: "Move it to production when you start shading.",
      when: `Approved ${whenText(order.sketchApprovedAt!, now)}.`,
    };
  }

  // "Accepted · Today", "Says they've paid · 3d ago" …
  const updates: OrderDetailView["updates"] = [];
  if (order.quoteAcceptedAt) updates.push({ k: "Quote", v: `Accepted · ${ago(order.quoteAcceptedAt, now)}` });
  if (order.customerPaidAt) updates.push({ k: "Deposit", v: `Says they've paid · ${ago(order.customerPaidAt, now)}` });
  if (approved) {
    updates.push({ k: "Sketch", v: `Approved · ${ago(order.sketchApprovedAt!, now)}` });
  } else if (order.sketchFeedback && order.sketchFeedbackAt) {
    updates.push({
      k: "Sketch",
      v: `Changes requested · ${ago(order.sketchFeedbackAt, now)}${pendingChanges ? "" : " · new sketch shared since"}`,
      quote: order.sketchFeedback,
    });
  }

  const when = ago(order.createdAt, now);
  const placed =
    (when === "Today" ? "Placed today" : when === "Yesterday" ? "Placed yesterday" : /^\d+d ago$/.test(when) ? `Placed ${parseInt(when, 10)} days ago` : `Placed ${fmtDate(order.createdAt)}`) +
    ` · ${pieceCount} ${pieceCount === 1 ? "piece" : "pieces"}`;

  const confirmedBody = approved
    ? "The sketch is approved. Move to production when you start shading."
    : pendingChanges
      ? `${first} asked for changes to the sketch. Share a new one below.`
      : sketches.length
        ? hasAccount
          ? `Sketch shared. Waiting for ${first} to approve it.`
          : `Sketch shared. Agree it with ${first} on WhatsApp before shading.`
        : `Deposit is in. Add a sketch photo below for ${first} to approve before shading.`;

  const nextBody: Record<string, string> = {
    PENDING: `${commission ? "Check the photo and size" : "Check the pieces and sizes"}, then send ${first} the price on WhatsApp: ${total}${kaduna ? " delivered" : " plus delivery outside Kaduna"}.`,
    AWAITING_DEPOSIT: `${deposit} (50%) with reference ${order.orderNumber}. Confirm once it lands in the account.`,
    CONFIRMED: confirmedBody,
    IN_PRODUCTION: `When the ${pieceCount > 1 ? "pieces are" : "piece is"} finished${anyFramed ? " and framed" : ""}, mark ${pieceCount > 1 ? "them" : "it"} ready and send a photo.`,
    READY: `Balance due on delivery: ${balance}.`,
    COMPLETED: "Delivered and paid in full.",
    CANCELLED: "This order was cancelled. The deposit is non-refundable if it was paid.",
  };

  const waText: Record<string, string> = {
    PENDING: `Hello ${first}, this is Zenom Studio about your request ${order.orderNumber}. The price is ${total}${kaduna ? " with delivery in Kaduna" : " plus delivery outside Kaduna"}. A 50% deposit of ${deposit} confirms the order.`,
    AWAITING_DEPOSIT: `Hello ${first}, a reminder about ${order.orderNumber}: the 50% deposit is ${deposit}. Please use ${order.orderNumber} as the payment reference.`,
    READY: `Hello ${first}, your order ${order.orderNumber} is ready. The balance on delivery is ${balance}.`,
  };
  const hasPhone = /\d{7,}/.test(order.customerPhone.replace(/\D/g, ""));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    customer: order.customerName,
    first,
    placed,
    neededBy,
    hasAccount,
    nextBody: nextBody[order.status],
    whatsappHref: hasPhone
      ? customerWhatsApp(order.customerPhone, waText[order.status] ?? `Hello ${first}, this is Zenom Studio about your order ${order.orderNumber}.`)
      : null,
    alert,
    updates,
    photos: order.photos.map((p) => ({ id: p.id, stage: p.stage, url: p.url, createdAt: p.createdAt.toISOString() })),
    pieces: order.items.map((it) => {
      const isCommission = isCommissionSlug(it.product.slug);
      const spec = [
        isCommission ? mediumLabel(it.medium) : it.product.archiveCode,
        it.sizeLabel ? `${it.sizeLabel} in` : null,
        it.framed ? "Framed" : "Paper only",
        it.subjectCount > 1 ? `${it.subjectCount} people` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const extra: string[] = [];
      if (isCommission && neededBy) extra.push(`Needed by ${neededBy}`);
      if (it.notes) extra.push(`Note: ${it.notes}`);
      return {
        key: it.id,
        name: it.product.name,
        image: pieceImage(it),
        spec,
        price: formatNaira(it.unitPrice) + (it.quantity > 1 ? ` × ${it.quantity}` : ""),
        extra,
        photoUrl: it.referencePhotoUrl ?? undefined,
      };
    }),
    money: [
      { k: "Pieces", v: formatNaira(order.subtotal) },
      { k: "Delivery", v: kaduna ? `${formatNaira(order.deliveryFee)} · Kaduna` : "Quoted on WhatsApp" },
      { k: "Total", v: total },
      { k: "Deposit 50%", v: deposit + (cancelled ? "" : flowIdx >= 2 ? " · paid" : " · due") },
      { k: "Balance", v: balance + (cancelled ? "" : order.status === "COMPLETED" ? " · paid" : " · on delivery") },
    ],
    contact: {
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      address: order.deliveryAddress,
    },
    notes: order.notes?.trim() ?? "",
  };
}
