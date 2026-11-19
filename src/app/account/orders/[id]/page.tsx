import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderDesktopView } from "@/components/account/OrderDesktopView";
import { OrderDetailScreen } from "@/components/mobile/customer/OrderDetailScreen";
import { ORDER_INCLUDE, toCustomerOrder } from "@/components/mobile/customer/server";

const TABS = ["quote", "payments", "progress", "docs"] as const;
type Tab = (typeof TABS)[number];

// Below 900px: the light app's order detail (tracker, next step, Quote /
// Payments / Progress / Docs). From 900px up: the dark desktop view with the
// same next step, buttons and progress photos. Bank details and times come
// from the studio settings (StudioInfoProvider in the account layout).
export default async function OrderDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const row = await prisma.order.findUnique({
    where: { id: params.id },
    include: ORDER_INCLUDE,
  });

  if (!row || row.userId !== (session.user as any).id) notFound();

  const tab = TABS.includes(searchParams.tab as Tab) ? (searchParams.tab as Tab) : undefined;
  const order = toCustomerOrder(row, Date.now());

  return (
    <>
      <OrderDetailScreen order={order} initialTab={tab} />
      <div className="mx-auto max-w-2xl px-6 py-16 max-[900px]:hidden">
        <OrderDesktopView order={order} />
      </div>
    </>
  );
}
