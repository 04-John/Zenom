import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true, size: true, backgroundTrack: true } } },
  });

  if (!order || order.userId !== (session.user as any).id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-navy">{order.orderNumber}</h1>
      <p className="mt-1 text-sm uppercase tracking-wide text-copper">{order.status}</p>

      <ul className="mt-8 space-y-4">
        {order.items.map((item) => (
          <li key={item.id} className="border-b border-charcoal/10 pb-4">
            <p className="font-medium text-navy">{item.product.name}</p>
            <p className="text-sm text-charcoal/60">
              {item.size?.label} · {item.backgroundTrack?.label} · x{item.quantity}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-1 text-sm text-charcoal/70">
        <p>Delivery: {order.deliveryAddress}</p>
        <p>Total: ₦{(order.totalAmount / 100).toLocaleString()}</p>
      </div>
    </div>
  );
}
