import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/pricing";
import { art } from "@/lib/catalog";
import { AuthPage } from "@/components/auth/AuthPage";
import { PageIntro } from "@/components/motion/PageIntro";
import { Reveal } from "@/components/motion/Reveal";
import { SignOutButton } from "@/components/account/SignOutButton";

export const metadata = { title: "My Account | Zenom Studio" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) return <AuthPage initialTab="login" />;

  const orders = await prisma.order.findMany({
    where: { userId: (session.user as { id?: string }).id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: { select: { name: true } } } } },
  });

  return (
    <>
      <PageIntro
        kicker="MY ACCOUNT"
        title="Your studio."
        blurb="Your commissions, in one place."
        bg="#171310"
        ink="#EFE9DF"
        images={["w02", "w04", "w03"].map(art)}
      />
      <div className="bg-night">
        <div className="mx-auto max-w-[1180px] px-6 pb-36 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="kicker">MY ACCOUNT</p>
              <h1 className="mt-4 font-display text-[clamp(52px,7vw,104px)] italic leading-[0.9]">Welcome back.</h1>
              {session.user?.name && <p className="mt-3 text-[15px] text-ink-2">{session.user.name}</p>}
            </div>
            <SignOutButton />
          </div>

          <p className="label-mono mb-4 mt-14">MY ORDERS</p>
          {orders.length === 0 ? (
            <div className="rounded-card border border-dashed border-ink/20 px-6 py-12 text-center text-ink-2">
              No orders yet. Pieces you send on WhatsApp appear here.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {orders.map((order) => {
                const summary = order.items
                  .map((i) => `${i.product.name}${i.sizeLabel ? ` · ${i.sizeLabel}` : ""}`)
                  .join(", ");
                const awaiting = order.status === "AWAITING_DEPOSIT";
                return (
                  <li key={order.id}>
                    <Reveal variant="up">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 rounded-[18px] bg-night-raised px-[22px] py-[18px] transition-colors hover:bg-night-hover min-[700px]:grid-cols-[minmax(0,1fr)_auto_auto]"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold">{order.orderNumber}</div>
                          <div className="mt-1 truncate text-[13px] text-ink-3">{summary}</div>
                        </div>
                        <span
                          className={
                            "order-3 justify-self-start rounded-pill border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] min-[700px]:order-none " +
                            (awaiting ? "border-ember/40 text-ember" : "border-ink/20 text-ink-3")
                          }
                        >
                          {awaiting ? "AWAITING DEPOSIT" : order.status.replace("_", " ")}
                        </span>
                        <span className="font-semibold">{formatNaira(order.total)}</span>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
