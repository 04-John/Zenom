import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StudioOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
      <h1 className="font-display text-3xl text-navy">Orders</h1>
      {/* Mobile: cards. Desktop: table — per the responsive admin-table rule. */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-charcoal/10 text-charcoal/50">
            <tr>
              <th className="py-2">Order #</th>
              <th className="py-2">Customer</th>
              <th className="py-2">Status</th>
              <th className="py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-charcoal/5">
                <td className="py-3">
                  <Link href={`/studio/orders/${o.id}`} className="text-copper underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="py-3">{o.customerName}</td>
                <td className="py-3">{o.status}</td>
                <td className="py-3">₦{(o.totalAmount / 100).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
