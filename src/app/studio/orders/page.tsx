import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/pricing";
import { ATTENTION_CLASS, ATTENTION_LABEL, attentionFlag } from "@/lib/order-flags";
import { pieceImage } from "@/lib/studio-stats";
import { ago } from "@/lib/zenom-mobile";
import { OrdersMobile, type OrderRow } from "@/components/mobile/studio/OrdersMobile";
import { StatusBadge, statusLabel } from "../StatusBadge";

export const dynamic = "force-dynamic";

const STATUSES = ["AWAITING_DEPOSIT", "PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"] as const;
const PAGE_SIZE = 25;
const MOBILE_LIMIT = 200; // the light app loads the latest orders and filters them on the phone

// The customer's taps, for the "Says paid" / "Changes asked" / "Sketch approved" chips.
const FLAG_SELECT = {
  customerPaidAt: true,
  sketchApprovedAt: true,
  sketchFeedbackAt: true,
  photos: { where: { stage: "SKETCH" as const }, orderBy: { createdAt: "desc" as const }, take: 1, select: { createdAt: true } },
};

export default async function StudioOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; page?: string };
}) {
  const status = STATUSES.find((s) => s === searchParams.status);
  const q = (searchParams.q ?? "").trim();
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where = {
    ...(status && { status }),
    ...(q && {
      OR: [
        { orderNumber: { contains: q, mode: "insensitive" as const } },
        { customerName: { contains: q, mode: "insensitive" as const } },
        { customerEmail: { contains: q, mode: "insensitive" as const } },
        { customerPhone: { contains: q } },
      ],
    }),
  };

  const [orders, count, grouped, latest] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { items: true } }, photos: FLAG_SELECT.photos },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: MOBILE_LIMIT,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        total: true,
        delivery: true,
        createdAt: true,
        customerPaidAt: FLAG_SELECT.customerPaidAt,
        sketchApprovedAt: FLAG_SELECT.sketchApprovedAt,
        sketchFeedbackAt: FLAG_SELECT.sketchFeedbackAt,
        photos: FLAG_SELECT.photos,
        items: {
          select: {
            referencePhotoUrl: true,
            quantity: true,
            product: { select: { images: { orderBy: { order: "asc" }, take: 1, select: { url: true } } } },
          },
        },
      },
    }),
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  const allCount = grouped.reduce((a, g) => a + g._count._all, 0);
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const now = Date.now();
  const mobileRows: OrderRow[] = latest.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customer: o.customerName,
    email: o.customerEmail,
    phone: o.customerPhone,
    status: o.status,
    total: formatNaira(o.total),
    age: ago(o.createdAt, now),
    pieces: o.items.reduce((a, it) => a + (it.quantity || 1), 0),
    kaduna: o.delivery === "KADUNA",
    image: o.items[0] ? pieceImage(o.items[0]) : null,
    flag: attentionFlag(o, o.photos[0]?.createdAt),
  }));

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status: status, q: q || undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/studio/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
    {/* Light studio app below 900px. */}
    <OrdersMobile rows={mobileRows} counts={counts} allCount={allCount} initialStatus={status ?? null} initialQ={q} />
    <div className="pb-24 pt-8 max-[900px]:hidden">
      <h1 className="h-section">Orders</h1>

      <form action="/studio/orders" className="mt-6 flex flex-wrap gap-3">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search order #, name, email or phone"
          className="field max-w-md flex-1"
        />
        <button className="rounded-pill border border-ink/25 px-5 py-2 text-sm text-ink hover:border-ink/60">Search</button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip href={href({ status: undefined, page: undefined })} on={!status} label={`All (${allCount})`} />
        {STATUSES.map((s) => (
          <Chip
            key={s}
            href={href({ status: s, page: undefined })}
            on={status === s}
            label={`${s === "AWAITING_DEPOSIT" ? "Awaiting deposit" : statusLabel(s)} (${counts[s] ?? 0})`}
          />
        ))}
      </div>

      {/* Scrolls horizontally inside its panel so the page never overflows at 375px. */}
      <div className="mt-6 overflow-x-auto rounded-card border border-ink/10 bg-night-raised">
        <table className="w-full min-w-[720px] text-left text-sm text-ink">
          <thead className="border-b border-ink/10">
            <tr className="label-mono">
              <th className="px-5 py-4 font-normal">Order #</th>
              <th className="px-5 py-4 font-normal">Placed</th>
              <th className="px-5 py-4 font-normal">Customer</th>
              <th className="px-5 py-4 font-normal">Pieces</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal">Total</th>
              <th className="px-5 py-4 font-normal">Deposit</th>
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
                <td className="whitespace-nowrap px-5 py-4 text-ink-2">
                  {o.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-4">
                  {o.customerName}
                  <span className="block text-xs text-ink-3">{o.customerPhone}</span>
                </td>
                <td className="px-5 py-4 text-ink-2">{o._count.items}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={o.status} />
                  <FlagBadge flag={attentionFlag(o, o.photos[0]?.createdAt)} />
                </td>
                <td className="px-5 py-4">{formatNaira(o.total)}</td>
                <td className="px-5 py-4 text-ink-2">{formatNaira(o.deposit)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-ink-3">
                  No orders match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-ink-2">
          {page > 1 ? <Link href={href({ page: String(page - 1) })} className="underline">← Newer</Link> : <span />}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={href({ page: String(page + 1) })} className="underline">Older →</Link> : <span />}
        </div>
      )}
    </div>
    </>
  );
}

/** What the customer tapped and Samuel still has to act on (under the status). */
function FlagBadge({ flag }: { flag: ReturnType<typeof attentionFlag> }) {
  if (!flag) return null;
  return (
    <span className={`mt-1.5 block w-fit whitespace-nowrap rounded-pill border px-3 py-1 text-[11px] font-semibold ${ATTENTION_CLASS[flag]}`}>
      {ATTENTION_LABEL[flag]}
    </span>
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
