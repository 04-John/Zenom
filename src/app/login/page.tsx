import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata = { title: "Sign in | Zenom Studio" };
export const dynamic = "force-dynamic";

// One login page, one auth system. Role-based routing (customer vs
// admin) happens after authentication, there is no separate /admin-login.
export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect((session.user as { role?: string }).role === "ADMIN" ? "/studio" : "/account");
  return <AuthPage initialTab="login" />;
}
