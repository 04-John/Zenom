import { PasswordReset } from "@/components/auth/PasswordReset";

export const metadata = { title: "Reset your password | Zenom Studio" };

export default function ForgotPasswordPage() {
  return <PasswordReset mode={{ kind: "forgot" }} />;
}
