import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

// ADMIN access is checked server-side from the authenticated session's
// role — never trust a client-side flag, never hide-and-hope.
export default async function StudioDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const [totalOrders, pendingOrders, inProduction, totalProducts] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "IN_PRODUCTION" } }),
    prisma.product.count(),
  ]);

  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
      <h1 className="font-display text-4xl text-navy">Studio</h1>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Pending" value={pendingOrders} />
        <StatCard label="In Production" value={inProduction} />
        <StatCard label="Products" value={totalProducts} />
      </div>

      <div className="mt-10 flex gap-4">
        <Link href="/studio/orders" className="text-copper underline">
          Manage Orders
        </Link>
        <Link href="/studio/products" className="text-copper underline">
          Manage Products
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-charcoal/10 p-5">
      <p className="text-2xl font-display text-navy">{value}</p>
      <p className="text-xs uppercase tracking-wide text-charcoal/50">{label}</p>
    </div>
  );
}
