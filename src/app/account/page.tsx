import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-4xl text-navy">My Account</h1>
      <p className="mt-2 text-charcoal/70">Welcome back, {session.user?.name}.</p>
      <div className="mt-10 space-y-4">
        <Link href="/account/orders" className="block rounded-card border border-charcoal/10 p-5 hover:border-copper">
          My Orders
        </Link>
      </div>
    </div>
  );
}
