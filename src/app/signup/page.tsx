import { AuthPage } from "@/components/auth/AuthPage";

export const metadata = { title: "Create account | Zenom Studio" };

export default function SignupPage() {
  return <AuthPage initialTab="signup" />;
}
