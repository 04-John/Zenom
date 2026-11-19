import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/pricing";
import { freeTextNotes, isCommissionSlug, parseCommissionNotes } from "@/lib/commission";
import { pieceImage } from "@/lib/studio-stats";
import { ORDER_FLOW, ago, customerWhatsApp, fmtDate } from "@/lib/zenom-mobile";
import { OrderDetailMobile, type OrderDetailView } from "@/components/mobile/studio/OrderDetailMobile";
import { StatusBadge } from "../../StatusBadge";
import { OrderStatusForm } from "./OrderStatusForm";

const INCLUDE = {
  items: { include: { product: { include: { images: { orderBy: { order: "asc" }, take: 1 } } } } },
} satisfies Prisma.OrderInclude;
type FullOrder = Prisma.OrderGetPayload<{ include: typeof INCLUDE }>;

export default async function StudioOrderDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { from?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: INCLUDE });
  if (!order) notFound();

  return (
    <>
      {/* Light studio app below 900px. */}
      <OrderDetailMobile
        o={toView(order)}
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

        <OrderStatusForm orderId={order.id} currentStatus={order.status} />

        <ul className="mt-8 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="rounded-tile border border-ink/10 bg-night-raised p-4 text-sm text-ink">
              <span className="font-medium">{item.product.name}</span>
              {item.product.archiveCode ? ` (${item.product.archiveCode})` : ""} — {item.sizeLabel ?? "size n/a"} in
              {" — "}
              {item.framed ? "framed" : "unframed"}
              {item.subjectCount > 1 ? ` — ${item.subjectCount} subjects` : ""} — {formatNaira(item.unitPrice)}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
              {item.notes && <p className="mt-1 text-ink-2">Note: {item.notes}</p>}
            </li>
          ))}
        </ul>

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
      </div>
    </>
  );
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
  const neededBy = parseCommissionNotes(null, order.notes).neededBy;

  const when = ago(order.createdAt, now);
  const placed =
    (when === "Today" ? "Placed today" : when === "Yesterday" ? "Placed yesterday" : /^\d+d ago$/.test(when) ? `Placed ${parseInt(when, 10)} days ago` : `Placed ${fmtDate(order.createdAt)}`) +
    ` · ${pieceCount} ${pieceCount === 1 ? "piece" : "pieces"}`;

  const nextBody: Record<string, string> = {
    PENDING: `${commission ? "Check the photo and size" : "Check the pieces and sizes"}, then send ${first} the price on WhatsApp: ${total}${kaduna ? " delivered" : " plus delivery outside Kaduna"}.`,
    AWAITING_DEPOSIT: `${deposit} (50%) with reference ${order.orderNumber}. Confirm once it lands in the account.`,
    CONFIRMED: "Deposit is in. Share the sketch with the customer before shading.",
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
    nextBody: nextBody[order.status],
    whatsappHref: hasPhone
      ? customerWhatsApp(order.customerPhone, waText[order.status] ?? `Hello ${first}, this is Zenom Studio about your order ${order.orderNumber}.`)
      : null,
    pieces: order.items.map((it) => {
      const isCommission = isCommissionSlug(it.product.slug);
      const c = parseCommissionNotes(it.notes, order.notes);
      const spec = [
        isCommission ? c.medium : it.product.archiveCode,
        it.sizeLabel ? `${it.sizeLabel} in` : null,
        it.framed ? "Framed" : "Paper only",
        it.subjectCount > 1 ? `${it.subjectCount} people` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      const extra: string[] = [];
      if (isCommission && neededBy) extra.push(`Needed by ${fmtDate(neededBy + "T12:00:00")}`);
      if (!isCommission && it.notes) extra.push(`Note: ${it.notes}`);
      return {
        key: it.id,
        name: it.product.name,
        image: pieceImage(it, order.notes),
        spec,
        price: formatNaira(it.unitPrice) + (it.quantity > 1 ? ` × ${it.quantity}` : ""),
        extra,
        photoUrl: isCommission ? c.photoUrl : undefined,
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
    notes: freeTextNotes(order.notes),
  };
}
