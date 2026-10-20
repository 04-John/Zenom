import { AuthPage } from "@/components/auth/AuthPage";

export const metadata = { title: "Sign in | Zenom Studio" };

// One login page, one auth system. Role-based routing (customer vs
// admin) happens after authentication, there is no separate /admin-login.
export default function LoginPage() {
  return <AuthPage initialTab="login" />;
}
