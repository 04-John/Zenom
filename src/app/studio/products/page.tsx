import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABEL, type Category } from "@/lib/pricing";
import { CATEGORIES } from "@/lib/studio-stats";
import { NOT_COMMISSION } from "@/lib/commission";
import { ART_GROUPS, art } from "@/lib/catalog";
import { ArtworksMobile, type ArtRow } from "@/components/mobile/studio/ArtworksMobile";
import { linkPrimary } from "../buttonStyles";
import { ArchiveProductButton } from "./ArchiveProductButton";
import { ProductStatusSelect } from "./ProductStatusSelect";

export const dynamic = "force-dynamic";

const STATUSES = ["AVAILABLE", "SOLD_OUT", "COMING_SOON", "DRAFT"] as const;
const STATUS_TEXT: Record<string, string> = {
  AVAILABLE: "Available",
  SOLD_OUT: "Sold out",
  COMING_SOON: "Coming soon",
  DRAFT: "Draft",
};
type ArtworksTiles = Parameters<typeof ArtworksMobile>[0]["tileImages"];
const catLabel = (c: string) => CATEGORY_LABEL[c.toLowerCase() as Category] ?? c;

export default async function StudioProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string; q?: string };
}) {
  const category = CATEGORIES.find((c) => c === searchParams.category);
  const status = STATUSES.find((s) => s === searchParams.status);
  const q = (searchParams.q ?? "").trim();

  // One query for the whole catalogue (commission placeholders excluded):
  // the desktop table is the filtered slice, the phone filters it in place.
  const [all, sold] = await Promise.all([
    prisma.product.findMany({
      where: NOT_COMMISSION,
      orderBy: [{ category: "asc" }, { archiveCode: "asc" }, { createdAt: "desc" }],
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
    }),
  ]);
  const ql = q.toLowerCase();
  const products = all.filter(
    (p) =>
      (!category || p.category === category) &&
      (!status || p.status === status) &&
      (!ql || p.name.toLowerCase().includes(ql) || (p.archiveCode ?? "").toLowerCase().includes(ql))
  );
  const soldBy = new Map(sold.map((s) => [s.productId, s._sum.quantity ?? 0]));
  const onSale = (c: string) => all.filter((p) => p.category === c && p.status === "AVAILABLE").length;
  const totalIn = (c: string) => all.filter((p) => p.category === c).length;

  const mobileArts: ArtRow[] = all.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.archiveCode,
    category: p.category,
    status: p.status,
    image: p.images[0]?.url ?? null,
    ordered: soldBy.get(p.id) ?? 0,
    featured: p.featured,
  }));
  // Tile headers: the first catalogue piece of each room.
  const tileImages = Object.fromEntries(ART_GROUPS.map((g) => [g.category.toUpperCase(), art(`${g.prefix}01`)])) as ArtworksTiles;

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { category, status, q: q || undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/studio/products${s ? `?${s}` : ""}`;
  };

  return (
    <>
    {/* Light studio app below 900px. */}
    <ArtworksMobile arts={mobileArts} tileImages={tileImages} initialStatus={status ?? null} initialCategory={category ?? null} initialQ={q} />
    <div className="pb-24 pt-8 max-[900px]:hidden">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="h-section">Artworks</h1>
        <Link href="/studio/products/new" className={linkPrimary}>
          + Add artwork
        </Link>
      </div>

      {/* Per-category stock cards double as filters. */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {CATEGORIES.map((c) => {
          const n = onSale(c);
          return (
            <Link
              key={c}
              href={href({ category: category === c ? undefined : c })}
              className={`rounded-tile border p-4 transition-colors ${
                category === c ? "border-ink bg-night-raised" : "border-ink/10 bg-night-raised hover:border-ink/40"
              }`}
            >
              <p className="label-mono">{catLabel(c)}</p>
              <p className={`mt-1 font-display text-2xl ${n === 0 ? "text-ember" : "text-ink"}`}>{n} on sale</p>
              <p className="mt-1 text-xs text-ink-3">
                {n === 0 ? "Empty — add or restore pieces" : `${totalIn(c)} total`}
              </p>
            </Link>
          );
        })}
      </div>

      <form action="/studio/products" className="mt-6 flex flex-wrap gap-3">
        {category && <input type="hidden" name="category" value={category} />}
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Search name or archive code" className="field max-w-md flex-1" />
        <button className="rounded-pill border border-ink/25 px-5 py-2 text-sm text-ink hover:border-ink/60">Search</button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip href={href({ status: undefined })} on={!status} label="Any status" />
        {STATUSES.map((s) => (
          <Chip key={s} href={href({ status: status === s ? undefined : s })} on={status === s} label={STATUS_TEXT[s]} />
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-ink/10 bg-night-raised">
        <table className="w-full min-w-[760px] text-left text-sm text-ink">
          <thead className="border-b border-ink/10">
            <tr className="label-mono">
              <th className="px-5 py-4 font-normal">Artwork</th>
              <th className="px-5 py-4 font-normal">Category</th>
              <th className="px-5 py-4 font-normal">Code</th>
              <th className="px-5 py-4 font-normal">Ordered</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4"></th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-ink/10 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of a Cloudinary URL
                      <img src={p.images[0].url} alt="" className="h-12 w-12 rounded-tile object-cover" loading="lazy" />
                    ) : (
                      <span className="h-12 w-12 rounded-tile bg-ink/10" />
                    )}
                    <span>
                      {p.name}
                      {p.featured && <span className="block text-xs text-ember">On home page</span>}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-2">{catLabel(p.category)}</td>
                <td className="px-5 py-3 font-mono text-xs text-ink-2">{p.archiveCode ?? "—"}</td>
                <td className="px-5 py-3 text-ink-2">{soldBy.get(p.id) ?? 0}</td>
                <td className="px-5 py-3">
                  <ProductStatusSelect productId={p.id} status={p.status} />
                </td>
                <td className="px-5 py-3">
                  <Link href={`/studio/products/${p.id}/edit`} className="text-ink underline hover:text-ember">
                    Edit
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <ArchiveProductButton productId={p.id} status={p.status} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-ink-3">
                  No artworks match.{" "}
                  <Link href="/studio/products/new" className="underline">
                    Add one
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

function Chip({ href, on, label }: { href: string; on: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-pill border px-4 py-2 text-xs ${
        on ? "border-ink bg-ink text-night" : "border-ink/20 text-ink-2 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
