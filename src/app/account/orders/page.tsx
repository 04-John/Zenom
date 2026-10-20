import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/pricing";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  AWAITING_DEPOSIT: "Awaiting deposit",
  CONFIRMED: "Confirmed",
  IN_PRODUCTION: "In Production",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-32">
      <h1 className="font-display text-5xl italic text-ink">My Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="You haven't created an order yet."
            action={
              <Link href="/portraits" className="text-ember underline">
                Explore the collection
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between gap-4 rounded-tile bg-night-raised p-5 transition-colors hover:bg-night-hover"
              >
                <div>
                  <p className="font-semibold text-ink">{order.orderNumber}</p>
                  <p className="text-sm text-ink-3">{order.items.length} item(s)</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
                    {STATUS_LABEL[order.status]}
                  </span>
                  <p className="mt-1 font-semibold text-ink">{formatNaira(order.total)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
