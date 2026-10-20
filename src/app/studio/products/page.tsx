import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { linkPrimary } from "../buttonStyles";
import { StatusBadge } from "../StatusBadge";
import { ArchiveProductButton } from "./ArchiveProductButton";

export default async function StudioProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login");

  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-container px-6 pb-24 pt-[140px] lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h-section">Products</h1>
        <Link href="/studio/products/new" className={linkPrimary}>
          + New Product
        </Link>
      </div>

      {/* Wide tables scroll horizontally inside their panel, so the page itself never overflows at 375px. */}
      <div className="mt-8 overflow-x-auto rounded-card border border-ink/10 bg-night-raised">
        <table className="w-full min-w-[640px] text-left text-sm text-ink">
          <thead className="border-b border-ink/10">
            <tr className="label-mono">
              <th className="px-5 py-4 font-normal">Name</th>
              <th className="px-5 py-4 font-normal">Category</th>
              <th className="px-5 py-4 font-normal">Archive code</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4"></th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-ink/10 last:border-0">
                <td className="px-5 py-4">{p.name}</td>
                <td className="px-5 py-4 text-ink-2">{p.category}</td>
                <td className="px-5 py-4 font-mono text-xs text-ink-2">{p.archiveCode ?? "—"}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-5 py-4">
                  <Link href={`/studio/products/${p.id}/edit`} className="text-ink underline hover:text-ember">
                    Edit
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <ArchiveProductButton productId={p.id} status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
