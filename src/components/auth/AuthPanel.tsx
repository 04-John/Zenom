"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { art } from "@/lib/catalog";
import { cn } from "@/lib/cn";

type Tab = "login" | "signup";

const ERROR_MESSAGES: Record<string, string> = {
  EmailNotVerified: "Please verify your email before signing in.",
  InvalidVerificationLink: "That verification link is invalid or has expired. Sign in and we'll send you a code instead.",
  TooManyAttempts: "Too many attempts. Please wait a while before trying again.",
  ServiceUnavailable: "We couldn't reach the database just now. Your details are fine, so wait a few seconds and try again.",
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
  // /signup?verify=<email> opens straight on the code step (used by the phone
  // sign-in page when it finds an unverified account).
  const verifyEmail = searchParams.get("verify") ?? "";
  const [form, setForm] = useState({ name: "", email: verifyEmail, password: "" });
  const errorParam = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    errorParam ? ERROR_MESSAGES[errorParam] ?? "Something went wrong." : null
  );
  const [loading, setLoading] = useState(false);
  // "code" = the account exists but the emailed 6-digit code hasn't been entered yet.
  const [step, setStep] = useState<"form" | "code">(verifyEmail ? "code" : "form");
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<string | null>(
    verifyEmail ? "Your account isn't verified yet. We've emailed you a new 6-digit code." : null
  );
  const justVerified = searchParams.get("verified") === "1";
  const justReset = searchParams.get("reset") === "1";

  function switchTab(next: Tab) {
    setTab(next);
    setError(null);
  }

  async function requestCode() {
    await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    }).catch(() => {});
  }

  // Signs in and routes admins to the studio, everyone else to their account.
  // Returns an error message, or null once the redirect has started.
  async function signInAndGo(): Promise<string | null> {
    const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    if (res?.error) return res.error;

    let dest = "/account";
    try {
      const session = await fetch("/api/auth/session").then((r) => r.json());
      if (session?.user?.role === "ADMIN") dest = "/studio";
    } catch {
      /* fall back to /account */
    }
    router.push(dest);
    router.refresh();
    return null;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const err = await signInAndGo();
    if (err === "EmailNotVerified") {
      // Right password, but the account was never verified: send a fresh code.
      await requestCode();
      setCode("");
      setInfo("Your account isn't verified yet. We've emailed you a new 6-digit code.");
      setStep("code");
      setLoading(false);
      return;
    }
    if (err) {
      setError(ERROR_MESSAGES[err] ?? "Incorrect email or password.");
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, code: code.trim() }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    // Verified. The password is still in the form, so sign straight in.
    const err = form.password ? await signInAndGo() : "NoPassword";
    if (err) {
      setStep("form");
      setTab("login");
      setInfo("Email verified. You can sign in now.");
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    await requestCode();
    setInfo("A new code is on its way. It can take a minute to arrive.");
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
    setCode("");
    setInfo(null);
    setStep("code");
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
        {step === "code" ? (
          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-ember">
              <Check size={28} strokeWidth={2.4} className="text-night" />
            </div>
            <h2 className="font-display text-[48px] italic leading-[0.95]">Check your email.</h2>
            <p className="mt-4 text-[15px] leading-[1.7] text-ink-2">
              We&rsquo;ve sent a 6-digit code to {form.email}. Enter it below to activate your account. If you
              don&rsquo;t see it, check your spam folder.
            </p>
            <form onSubmit={handleVerify} className="mt-6 flex flex-col gap-3">
              <input
                className="field text-center font-mono text-2xl tracking-[0.5em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/D/g, ""))}
                aria-label="6-digit verification code"
              />
              {info && !error && <p className="text-sm text-ember">{info}</p>}
              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}
              <Button type="submit" loading={loading} disabled={code.length !== 6} className="mt-2 w-full py-[15px] text-[15px]">
                Verify and continue
              </Button>
              <button type="button" onClick={handleResend} className="text-sm text-ink-2 underline hover:text-ink">
                Send me a new code
              </button>
            </form>
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
              {!isSignup && (
                <Link href="/forgot-password" className="self-end py-1 text-[13px] text-ink-2 underline hover:text-ember">
                  Forgot password?
                </Link>
              )}
              {justReset && !error && !isSignup && (
                <p role="status" className="text-sm text-ember">Password updated. Sign in with your new password.</p>
              )}
              {(justVerified || info) && !error && !isSignup && (
                <p className="text-sm text-ember">{info ?? "Email verified. You can sign in now."}</p>
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
