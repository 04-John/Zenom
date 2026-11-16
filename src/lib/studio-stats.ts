// Admin analytics. All money is kobo. Definitions (shown on the dashboard):
//  - Confirmed sales: orders whose deposit has been received and that are not
//    cancelled (CONFIRMED, IN_PRODUCTION, READY, COMPLETED).
//  - Pipeline: orders still waiting on the deposit (PENDING, AWAITING_DEPOSIT).
//  - Cash collected: the deposit on active orders, the full total once COMPLETED.
import { prisma } from "@/lib/prisma";

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

export async function getDashboard(range: RangeKey) {
  const since = range === "all" ? null : new Date(Date.now() - Number(range) * 86_400_000);
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
        items: {
          select: {
            unitPrice: true,
            quantity: true,
            framed: true,
            sizeLabel: true,
            productId: true,
            product: { select: { name: true, category: true, archiveCode: true } },
          },
        },
      },
    }),
    prisma.product.groupBy({ by: ["category", "status"], _count: { _all: true } }),
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

  // Revenue by category + top artworks + size / framing mix (confirmed + pipeline items).
  const byCategory: Record<string, { revenue: number; pieces: number }> = {};
  for (const c of CATEGORIES) byCategory[c] = { revenue: 0, pieces: 0 };
  const artworks = new Map<string, { name: string; code: string | null; category: string; pieces: number; revenue: number }>();
  const sizes = new Map<string, number>();
  let framedCount = 0;
  let pieceCount = 0;
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
      };
      a.pieces += qty;
      a.revenue += rev;
      artworks.set(it.productId, a);
      if (it.sizeLabel) sizes.set(it.sizeLabel, (sizes.get(it.sizeLabel) ?? 0) + qty);
      if (it.framed) framedCount += qty;
      pieceCount += qty;
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
      cashCollected,
      balanceDue: confirmedSales - cashCollected,
      orderCount: active.length,
      avgOrder: active.length ? Math.round(sum(active) / active.length) : 0,
      cancelled: orders.length - active.length,
      customers,
      repeatBuyers,
      framedPct: pieceCount ? Math.round((framedCount / pieceCount) * 100) : 0,
      kadunaPct: active.length ? Math.round((active.filter((o) => o.delivery === "KADUNA").length / active.length) * 100) : 0,
    },
    series,
    byCategory,
    topArtworks: [...artworks.values()].sort((a, b) => b.pieces - a.pieces || b.revenue - a.revenue).slice(0, 6),
    sizes: [...sizes.entries()].sort((a, b) => b[1] - a[1]),
    statusCounts,
    stock,
    recent: [...orders].reverse().slice(0, 6),
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
