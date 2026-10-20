"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { art } from "@/lib/catalog";
import { cn } from "@/lib/cn";

type Tab = "login" | "signup";

const ERROR_MESSAGES: Record<string, string> = {
  EmailNotVerified: "Please verify your email before signing in. Check your inbox for the link.",
  InvalidVerificationLink: "That verification link is invalid or has expired.",
  TooManyAttempts: "Too many attempts. Please wait a while before trying again.",
};

// Split image + auth panel. /account, /login and /signup all render this;
// `initialTab` preselects the tab for the direct URLs.
export function AuthPanel({ initialTab = "login" }: { initialTab?: Tab }) {
  return (
    <Suspense>
      <AuthPanelInner initialTab={initialTab} />
    </Suspense>
  );
}

function AuthPanelInner({ initialTab }: { initialTab: Tab }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const errorParam = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    errorParam ? ERROR_MESSAGES[errorParam] ?? "Something went wrong." : null
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const justVerified = searchParams.get("verified") === "1";

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });

    if (res?.error) {
      setError(ERROR_MESSAGES[res.error] ?? "Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  }

  const isSignup = tab === "signup";

  return (
    <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-6 pb-36 pt-16 min-[900px]:grid-cols-2">
      <Reveal variant="blur">
        <div className="relative min-h-[420px] overflow-hidden rounded-card bg-night-raised min-[900px]:min-h-[520px]">
          <Image
            src={art("w02")}
            alt=""
            fill
            sizes="(min-width: 900px) 560px, 100vw"
            className="object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night from-5% to-night/0 to-60%" />
          <p className="absolute bottom-7 left-7 right-7 font-display text-[44px] italic leading-none">
            Your commissions, in one place.
          </p>
        </div>
      </Reveal>

      <div className="max-w-[440px]">
        {submitted ? (
          <div role="status">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-ember">
              <Check size={28} strokeWidth={2.4} className="text-night" />
            </div>
            <h2 className="font-display text-[48px] italic leading-[0.95]">Check your email.</h2>
            <p className="mt-4 text-[15px] leading-[1.7] text-ink-2">
              We&rsquo;ve sent a verification link to {form.email}. Click it to activate your account, then sign in.
            </p>
          </div>
        ) : (
          <>
            <div className="flex w-max gap-1.5 rounded-pill bg-night-raised p-[5px]" role="tablist">
              {(
                [
                  ["login", "Sign in"],
                  ["signup", "Create account"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => switchTab(id)}
                  className={cn(
                    "rounded-pill px-5 py-2.5 text-[13px] font-semibold transition-colors",
                    tab === id ? "bg-ink text-night" : "text-ink-2 hover:text-ink"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <h1 className="my-7 font-display text-[clamp(44px,5vw,64px)] italic leading-[0.95]">
              {isSignup ? "Join the studio." : "Welcome back."}
            </h1>

            <form onSubmit={isSignup ? handleSignup : handleLogin} className="flex flex-col gap-3">
              {isSignup && (
                <input
                  className="field"
                  placeholder="Full name"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              )}
              <input
                className="field"
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="field"
                type="password"
                placeholder="Password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={isSignup ? 8 : undefined}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {justVerified && !error && !isSignup && (
                <p className="text-sm text-ember">Email verified. You can sign in now.</p>
              )}
              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}
              <Button type="submit" loading={loading} className="mt-2 w-full py-[15px] text-[15px]">
                {isSignup ? "Create account" : "Sign in"}
              </Button>
              {isSignup && (
                <p className="text-xs leading-relaxed text-ink-3">
                  By creating an account you agree to our{" "}
                  <a href="/terms" className="underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
