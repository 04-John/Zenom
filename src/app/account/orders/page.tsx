import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
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
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy">My Orders</h1>

      {orders.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="You haven't created an order yet."
            action={
              <Link href="/portraits" className="text-copper underline">
                Explore the collection
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between rounded-card border border-charcoal/10 p-5 hover:border-copper"
              >
                <div>
                  <p className="font-medium text-navy">{order.orderNumber}</p>
                  <p className="text-sm text-charcoal/60">{order.items.length} item(s)</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-copper">
                  {STATUS_LABEL[order.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
