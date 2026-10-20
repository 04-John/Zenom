import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatNaira } from "@/lib/pricing";
import { StatusBadge } from "../StatusBadge";

export default async function StudioOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <div className="mx-auto max-w-container px-6 pb-24 pt-[140px] lg:px-10">
      <h1 className="h-section">Orders</h1>
      {/* Scrolls horizontally inside its panel so the page never overflows at 375px. */}
      <div className="mt-8 overflow-x-auto rounded-card border border-ink/10 bg-night-raised">
        <table className="w-full min-w-[560px] text-left text-sm text-ink">
          <thead className="border-b border-ink/10">
            <tr className="label-mono">
              <th className="px-5 py-4 font-normal">Order #</th>
              <th className="px-5 py-4 font-normal">Customer</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-ink/10 last:border-0">
                <td className="px-5 py-4">
                  <Link href={`/studio/orders/${o.id}`} className="font-mono text-xs text-ink underline hover:text-ember">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-5 py-4">{o.customerName}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-5 py-4">{formatNaira(o.total)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-ink-3">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
