import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/pricing";
import { StatusBadge } from "../../StatusBadge";
import { OrderStatusForm } from "./OrderStatusForm";

export default async function StudioOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-[140px]">
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
  );
}
