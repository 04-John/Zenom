import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function StudioProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-container px-6 py-16 lg:px-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-navy">Products</h1>
        <Link href="/studio/products/new" className="text-copper underline">
          + New Product
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-charcoal/10 text-charcoal/50">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Pillar</th>
              <th className="py-2">Status</th>
              <th className="py-2">Price</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-charcoal/5">
                <td className="py-3">{p.name}</td>
                <td className="py-3">{p.pillar}</td>
                <td className="py-3">{p.status}</td>
                <td className="py-3">₦{(p.basePrice / 100).toLocaleString()}</td>
                <td className="py-3">
                  <Link href={`/studio/products/${p.id}/edit`} className="text-copper underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
