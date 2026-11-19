import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileScreen } from "@/components/mobile/customer/ProfileScreen";

export const metadata = { title: "Account | Zenom Studio" };
export const dynamic = "force-dynamic";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Customer app Account tab. Name and email come from the User row; phone and
// addresses from the customer's orders (src/app/account/layout.tsx).
export default async function AccountProfilePage() {
  const session = await getServerSession(authOptions);
  const sUser = session?.user as { id?: string; name?: string | null; email?: string | null } | undefined;
  if (!sUser?.id) redirect("/login");

  let row: { name: string | null; email: string; createdAt: Date } | null = null;
  try {
    row = await prisma.user.findUnique({ where: { id: sUser.id }, select: { name: true, email: true, createdAt: true } });
  } catch (err) {
    console.error("Profile failed to load:", err);
  }

  return (
    <ProfileScreen
      account={{
        name: row?.name ?? sUser.name ?? null,
        email: row?.email ?? sUser.email ?? null,
        memberSince: row ? `${MON[row.createdAt.getMonth()]} ${row.createdAt.getFullYear()}` : null,
      }}
    />
  );
}
