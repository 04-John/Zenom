import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatusForm } from "./OrderStatusForm";

export default async function StudioOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true, size: true, backgroundTrack: true } } },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-navy">{order.orderNumber}</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        {order.customerName} · {order.customerPhone} · {order.customerEmail}
      </p>

      <OrderStatusForm orderId={order.id} currentStatus={order.status} />

      <ul className="mt-8 space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="border-b border-charcoal/10 pb-3 text-sm">
            {item.product.name} — {item.size?.label} — {item.backgroundTrack?.label} — x{item.quantity}
            {item.notes && <p className="text-charcoal/50">Note: {item.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
