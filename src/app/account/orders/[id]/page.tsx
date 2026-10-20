import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/pricing";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: { include: { product: true } } },
  });

  if (!order || order.userId !== (session.user as any).id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl text-ink">{order.orderNumber}</h1>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-ember">
        {order.status === "AWAITING_DEPOSIT" ? "Awaiting deposit" : order.status.replace("_", " ")}
      </p>

      <ul className="mt-8 space-y-4">
        {order.items.map((item) => (
          <li key={item.id} className="border-b border-ink/10 pb-4">
            <p className="font-medium text-ink">{item.product.name}</p>
            <p className="text-sm text-ink-2">
              {item.sizeLabel ?? "—"} in · {item.framed ? "framed" : "unframed"}
              {item.subjectCount > 1 ? ` · ${item.subjectCount} subjects` : ""} · {formatNaira(item.unitPrice)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-1 text-sm text-ink-2">
        <p>Delivery: {order.deliveryAddress}</p>
        <p>
          {order.delivery === "KADUNA"
            ? `Delivery within Kaduna: ${formatNaira(order.deliveryFee)}`
            : "Delivery outside Kaduna: quoted on WhatsApp"}
        </p>
        <p className="text-ink">Total: {formatNaira(order.total)}</p>
        <p>50% deposit to begin: {formatNaira(order.deposit)}</p>
      </div>
    </div>
  );
}
