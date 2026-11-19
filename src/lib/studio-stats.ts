// Admin analytics. All money is kobo. Definitions (shown on the dashboard):
//  - Confirmed sales: orders whose deposit has been received and that are not
//    cancelled (CONFIRMED, IN_PRODUCTION, READY, COMPLETED).
//  - Pipeline: orders still waiting on the deposit (PENDING, AWAITING_DEPOSIT).
//  - Cash collected: the deposit on active orders, the full total once COMPLETED.
import { prisma } from "@/lib/prisma";
import { NOT_COMMISSION, isCommissionSlug, parseCommissionNotes } from "@/lib/commission";
import { CATEGORY_LABEL, formatNaira, fromDbCategory, type DbCategory } from "@/lib/pricing";
import { ago } from "@/lib/zenom-mobile";

export const CONFIRMED_STATUSES = ["CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED"] as const;
export const PIPELINE_STATUSES = ["PENDING", "AWAITING_DEPOSIT"] as const;
export const CATEGORIES = ["PORTRAIT", "GEOMETRIC", "MINIMALISTIC", "FIGURATIVE"] as const;

export type RangeKey = "7" | "30" | "90" | "all";
export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
  { key: "all", label: "All time" },
];

export function parseRange(v?: string): RangeKey {
  return v === "7" || v === "90" || v === "all" ? v : "30";
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const DAY = 86_400_000;

/** The picture to show for one ordered piece: the customer's reference photo on a commission, else the artwork's first image. */
export function pieceImage(
  item: { notes?: string | null; product: { images?: { url: string }[] } },
  orderNotes?: string | null
): string | null {
  return parseCommissionNotes(item.notes, orderNotes).photoUrl ?? item.product.images?.[0]?.url ?? null;
}

/** "Portrait, 20×24 framed" (commission) or "Held Gaze, 16×20 framed"; "+ 1 more" for multi-piece orders. */
export function orderSpec(items: { framed: boolean; sizeLabel: string | null; product: { name: string; slug: string; category: DbCategory } }[]): string {
  const first = items[0];
  if (!first) return "";
  const what = isCommissionSlug(first.product.slug) ? CATEGORY_LABEL[fromDbCategory(first.product.category)] : first.product.name;
  const size = [first.sizeLabel, first.framed ? "framed" : null].filter(Boolean).join(" ");
  return [what, size].filter(Boolean).join(", ") + (items.length > 1 ? ` + ${items.length - 1} more` : "");
}

export async function getDashboard(range: RangeKey) {
  const since = range === "all" ? null : new Date(Date.now() - Number(range) * DAY);
  const where = since ? { createdAt: { gte: since } } : {};

  const [orders, productCounts, customers] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        deposit: true,
        delivery: true,
        createdAt: true,
        customerName: true,
        userId: true,
        notes: true,
        items: {
          select: {
            unitPrice: true,
            quantity: true,
            framed: true,
            sizeLabel: true,
            productId: true,
            notes: true,
            product: {
              select: {
                name: true,
                category: true,
                archiveCode: true,
                slug: true,
                images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    }),
    // Commission placeholders are not catalogue pieces, so they never count as stock.
    prisma.product.groupBy({ by: ["category", "status"], where: NOT_COMMISSION, _count: { _all: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  const active = orders.filter((o) => o.status !== "CANCELLED");
  const confirmed = orders.filter((o) => (CONFIRMED_STATUSES as readonly string[]).includes(o.status));
  const pipeline = orders.filter((o) => (PIPELINE_STATUSES as readonly string[]).includes(o.status));

  const sum = (xs: { total: number }[]) => xs.reduce((a, o) => a + o.total, 0);
  const confirmedSales = sum(confirmed);
  const pipelineValue = sum(pipeline);
  const cashCollected = confirmed.reduce((a, o) => a + (o.status === "COMPLETED" ? o.total : o.deposit), 0);

  // Daily series (orders placed + confirmed revenue), zero-filled.
  const days: { date: string; orders: number; revenue: number }[] = [];
  const start = since ?? (orders[0] ? new Date(orders[0].createdAt) : new Date());
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const end = new Date();
  // Cap "all time" so the chart stays readable; group by week beyond 120 days.
  while (cursor <= end) {
    days.push({ date: dayKey(cursor), orders: 0, revenue: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const byDay = new Map(days.map((d) => [d.date, d]));
  for (const o of active) {
    const d = byDay.get(dayKey(o.createdAt));
    if (!d) continue;
    d.orders += 1;
    if ((CONFIRMED_STATUSES as readonly string[]).includes(o.status)) d.revenue += o.total;
  }
  const series = days.length > 120 ? bucketWeekly(days) : days;

  // Mobile overview: confirmed sales in 6 equal buckets across the range
  // (oldest → newest; "all time" spans back to the first order, at least 90 days).
  const salesBars = sixBuckets(
    confirmed.map((o) => ({ at: o.createdAt.getTime(), total: o.total })),
    since ? Date.now() - since.getTime() : Math.max(90 * DAY, Date.now() - (orders[0]?.createdAt.getTime() ?? Date.now()))
  );

  // Revenue by category + top artworks + size / framing mix (confirmed + pipeline items).
  const byCategory: Record<string, { revenue: number; pieces: number }> = {};
  for (const c of CATEGORIES) byCategory[c] = { revenue: 0, pieces: 0 };
  const artworks = new Map<string, { name: string; code: string | null; category: string; pieces: number; revenue: number; image: string | null }>();
  const sizes = new Map<string, number>();
  let framedCount = 0;
  let pieceCount = 0;
  let inProductionPieces = 0;
  for (const o of active) {
    for (const it of o.items) {
      const qty = it.quantity || 1;
      const rev = it.unitPrice * qty;
      byCategory[it.product.category].revenue += rev;
      byCategory[it.product.category].pieces += qty;
      const a = artworks.get(it.productId) ?? {
        name: it.product.name,
        code: it.product.archiveCode,
        category: it.product.category,
        pieces: 0,
        revenue: 0,
        image: null as string | null,
      };
      a.pieces += qty;
      a.revenue += rev;
      a.image = a.image ?? pieceImage(it, o.notes);
      artworks.set(it.productId, a);
      if (it.sizeLabel) sizes.set(it.sizeLabel, (sizes.get(it.sizeLabel) ?? 0) + qty);
      if (it.framed) framedCount += qty;
      pieceCount += qty;
      if (o.status === "IN_PRODUCTION") inProductionPieces += qty;
    }
  }

  const statusCounts: Record<string, number> = {};
  for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;

  // Catalogue health per category: how many pieces are on sale right now.
  const stock: Record<string, { available: number; soldOut: number; draft: number; comingSoon: number }> = {};
  for (const c of CATEGORIES) stock[c] = { available: 0, soldOut: 0, draft: 0, comingSoon: 0 };
  for (const g of productCounts) {
    const s = stock[g.category];
    const n = g._count._all;
    if (g.status === "AVAILABLE") s.available += n;
    else if (g.status === "SOLD_OUT") s.soldOut += n;
    else if (g.status === "DRAFT") s.draft += n;
    else s.comingSoon += n;
  }

  const repeatBuyers = (() => {
    const counts = new Map<string, number>();
    for (const o of active) if (o.userId) counts.set(o.userId, (counts.get(o.userId) ?? 0) + 1);
    return [...counts.values()].filter((n) => n > 1).length;
  })();

  return {
    kpis: {
      confirmedSales,
      pipelineValue,
      pipelineCount: pipeline.length,
      cashCollected,
      balanceDue: confirmedSales - cashCollected,
      orderCount: active.length,
      avgOrder: active.length ? Math.round(sum(active) / active.length) : 0,
      cancelled: orders.length - active.length,
      customers,
      repeatBuyers,
      inProductionPieces,
      framedPct: pieceCount ? Math.round((framedCount / pieceCount) * 100) : 0,
      kadunaPct: active.length ? Math.round((active.filter((o) => o.delivery === "KADUNA").length / active.length) * 100) : 0,
    },
    series,
    salesBars,
    byCategory,
    topArtworks: [...artworks.values()].sort((a, b) => b.pieces - a.pieces || b.revenue - a.revenue).slice(0, 6),
    sizes: [...sizes.entries()].sort((a, b) => b[1] - a[1]),
    statusCounts,
    stock,
    recent: [...orders]
      .reverse()
      .slice(0, 6)
      .map((o) => ({ ...o, image: o.items[0] ? pieceImage(o.items[0], o.notes) : null })),
  };
}

function bucketWeekly(days: { date: string; orders: number; revenue: number }[]) {
  const out: { date: string; orders: number; revenue: number }[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    out.push({
      date: chunk[0].date,
      orders: chunk.reduce((a, d) => a + d.orders, 0),
      revenue: chunk.reduce((a, d) => a + d.revenue, 0),
    });
  }
  return out;
}

/** Six equal time buckets ending now. Labels mark each bucket's recent edge: "-25d" … "Now". */
function sixBuckets(points: { at: number; total: number }[], spanMs: number) {
  const n = 6;
  const now = Date.now();
  const step = spanMs / n;
  const from = now - spanMs;
  const out = Array.from({ length: n }, (_, i) => {
    const back = (n - 1 - i) * step;
    const label =
      i === n - 1 ? "Now" : spanMs > 120 * DAY ? `-${Math.round(back / (30 * DAY))}mo` : `-${Math.max(1, Math.round(back / DAY))}d`;
    return { label, value: 0 };
  });
  for (const p of points) {
    const i = Math.min(n - 1, Math.floor((p.at - from) / step));
    if (i >= 0) out[i].value += p.total;
  }
  return out;
}

/* ── Studio app chrome: notifications, tab badge, push banner ── */

const ALERT_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  customerName: true,
  deposit: true,
  createdAt: true,
  updatedAt: true,
  notes: true,
  items: {
    select: {
      framed: true,
      sizeLabel: true,
      notes: true,
      quantity: true,
      product: {
        select: {
          name: true,
          slug: true,
          category: true,
          images: { orderBy: { order: "asc" as const }, take: 1, select: { url: true } },
        },
      },
    },
  },
} as const;

export type StudioNotice = { key: string; orderId: string; title: string; body: string; when: string; image: string | null; at: number };
export type StudioNewest = { id: string; title: string; body: string };

/**
 * Notifications for the studio app, derived from live orders:
 *  - PENDING                       → "New commission request" (or "New order")
 *  - AWAITING_DEPOSIT, older 48h   → "Deposit due"
 *  - READY                         → "Order ready for delivery"
 *  - COMPLETED in the last 7 days  → "Payment completed"
 * plus the PENDING count (Orders tab badge) and the newest orders (push banner).
 */
export async function getStudioAlerts() {
  const now = Date.now();
  const [pendingCount, attention, newest] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "AWAITING_DEPOSIT", createdAt: { lte: new Date(now - 2 * DAY) } },
          { status: "READY" },
          { status: "COMPLETED", updatedAt: { gte: new Date(now - 7 * DAY) } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: ALERT_SELECT,
    }),
    prisma.order.findMany({
      where: { status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: ALERT_SELECT,
    }),
  ]);

  const isCommission = (o: (typeof newest)[number]) => !!o.items[0] && isCommissionSlug(o.items[0].product.slug);
  const pieces = (o: (typeof newest)[number]) => o.items.reduce((a, it) => a + (it.quantity || 1), 0);

  const notices: StudioNotice[] = attention
    .map((o): StudioNotice => {
      const image = o.items[0] ? pieceImage(o.items[0], o.notes) : null;
      const base = { orderId: o.id, image };
      switch (o.status) {
        case "PENDING":
          return { ...base, key: `new:${o.id}`, title: isCommission(o) ? "New commission request" : "New order", body: `${o.orderNumber} · ${o.customerName} · ${orderSpec(o.items)}`, when: ago(o.createdAt, now), at: o.createdAt.getTime() };
        case "AWAITING_DEPOSIT": {
          const due = o.createdAt.getTime() + 2 * DAY;
          return { ...base, key: `deposit:${o.id}`, title: "Deposit due", body: `${o.orderNumber} · ${o.customerName} · ${formatNaira(o.deposit)}`, when: ago(due, now), at: due };
        }
        case "READY": {
          const n = pieces(o);
          return { ...base, key: `ready:${o.id}`, title: "Order ready for delivery", body: `${o.orderNumber} · ${o.customerName} · ${n} piece${n === 1 ? "" : "s"}`, when: ago(o.updatedAt, now), at: o.updatedAt.getTime() };
        }
        default:
          return { ...base, key: `paid:${o.id}`, title: "Payment completed", body: `${o.orderNumber} · ${o.customerName}`, when: ago(o.updatedAt, now), at: o.updatedAt.getTime() };
      }
    })
    .sort((a, b) => b.at - a.at);

  return {
    pendingCount,
    notices,
    newest: newest.map((o): StudioNewest => ({
      id: o.id,
      title: isCommission(o) ? "New commission request" : "New order",
      body: `${o.orderNumber} · ${o.customerName} · ${orderSpec(o.items)}`,
    })),
  };
}
