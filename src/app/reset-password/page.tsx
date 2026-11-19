import { PasswordReset } from "@/components/auth/PasswordReset";

export const metadata = { title: "Choose a new password | Zenom Studio", robots: { index: false } };
export const dynamic = "force-dynamic";

// Opened from the reset email: /reset-password?token=…  The token is checked
// when the form is sent (POST /api/auth/reset-password), not on page load.
export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  const token = typeof searchParams.token === "string" && searchParams.token ? searchParams.token : null;
  return <PasswordReset mode={{ kind: "reset", token }} />;
}
