"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";

const ERROR_MESSAGES: Record<string, string> = {
  EmailNotVerified: "Please verify your email before signing in — check your inbox for the link.",
  InvalidVerificationLink: "That verification link is invalid or has expired.",
};

// One login page, one auth system. Role-based routing (customer vs
// admin) happens after authentication in the redirect below — there is
// no separate /admin-login.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? ERROR_MESSAGES[searchParams.get("error")!] ?? "Something went wrong." : null
  );
  const [loading, setLoading] = useState(false);
  const justVerified = searchParams.get("verified") === "1";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });

    if (res?.error) {
      setError(ERROR_MESSAGES[res.error] ?? "Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-display text-3xl text-navy">Sign In</h1>
      {justVerified && !error && (
        <p className="mt-4 text-sm text-green-700">Email verified — you can sign in now.</p>
      )}
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-btn border border-charcoal/20 p-3 text-sm focus:border-copper focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-btn border border-charcoal/20 p-3 text-sm focus:border-copper focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>
      <p className="mt-6 text-sm text-charcoal/60">
        New here?{" "}
        <a href="/signup" className="text-copper underline">
          Create an account
        </a>
      </p>
    </div>
  );
}
