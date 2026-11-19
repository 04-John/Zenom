"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { Cta, LightPage, useShake } from "@/components/mobile/ui";
import { art } from "@/lib/catalog";

// Same messages as the desktop AuthPanel (next-auth error codes from lib/auth.ts).
const ERROR_MESSAGES: Record<string, string> = {
  EmailNotVerified: "Please verify your email before signing in. Check your inbox for the link.",
  InvalidVerificationLink: "That verification link is invalid or has expired.",
  TooManyAttempts: "Too many attempts. Please wait a while before trying again.",
  ServiceUnavailable: "We couldn't reach the database just now. Your details are fine, so wait a few seconds and try again.",
};

/** True when the sign-in was triggered by a /studio page (layout or middleware redirect). */
function pointsIntoStudio(callbackUrl: string | null): boolean {
  if (!callbackUrl) return false;
  try {
    const path = new URL(callbackUrl, "https://zenom.invalid").pathname;
    return path === "/studio" || path.startsWith("/studio/");
  } catch {
    return false;
  }
}

/**
 * Light sign-in screen for phones (below 900px), from Studio-Mobile.dc.html:
 * dark artwork header, the mark draws itself, "Welcome back, Samuel." when
 * the sign-in leads into /studio. Same credentials flow and routing as the
 * desktop AuthPanel (admins → /studio, everyone else → /account).
 */
export function MobileSignIn() {
  return (
    <Suspense fallback={<SignInView studio={false} errorParam={null} verified={false} reset={false} />}>
      <SignInFromUrl />
    </Suspense>
  );
}

function SignInFromUrl() {
  const sp = useSearchParams();
  return (
    <SignInView
      studio={pointsIntoStudio(sp.get("callbackUrl"))}
      errorParam={sp.get("error")}
      verified={sp.get("verified") === "1"}
      reset={sp.get("reset") === "1"}
    />
  );
}

function SignInView({ studio, errorParam, verified, reset }: { studio: boolean; errorParam: string | null; verified: boolean; reset: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(errorParam ? ERROR_MESSAGES[errorParam] ?? "Something went wrong." : null);
  const emailShake = useShake();
  const passShake = useShake();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!email.trim() || !password) {
      if (!email.trim()) emailShake.shake();
      if (!password) passShake.shake();
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email: email.trim(), password, redirect: false });
    if (res?.error) {
      setError(ERROR_MESSAGES[res.error] ?? "Incorrect email or password.");
      setLoading(false);
      return;
    }

    // Admins land in the studio dashboard, everyone else in their account.
    let dest = "/account";
    try {
      const session = await fetch("/api/auth/session").then((r) => r.json());
      if (session?.user?.role === "ADMIN") dest = "/studio";
    } catch {
      /* fall back to /account */
    }
    router.push(dest);
    router.refresh();
  }

  const fieldCls = (s: { cls: string }) => "field " + s.cls;

  return (
    <LightPage desktop="hide">
      <section className="intro-in" aria-label={studio ? "Studio sign in" : "Sign in"} style={{ flex: 1, minHeight: "100dvh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", height: "min(330px, 44dvh)", minHeight: 250, flex: "none", background: "#12100E", overflow: "hidden", borderRadius: "0 0 32px 32px" }}>
          <Image src={art("w07")} alt="" fill sizes="(max-width: 560px) 100vw, 560px" style={{ objectFit: "cover", opacity: 0.55 }} />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(18,16,14,.4), rgba(18,16,14,.92))" }} />
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 28, color: "#ffffff", display: "flex", flexDirection: "column", gap: 10 }}>
            <span aria-hidden="true" style={{ display: "block", width: 44, height: 44 }}>
              <ZenomMark size={44} ink="#ffffff" draw="once" duration={1400} title="" />
            </span>
            <span className="kick" style={{ color: "#E58A52" }}>
              {studio ? "Zenom Studio · Admin" : "Zenom Studio"}
            </span>
            <h1 style={{ margin: 0, fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: 38, lineHeight: 1 }}>
              {studio ? (
                <>
                  Welcome back,
                  <br />
                  Samuel.
                </>
              ) : (
                "Welcome back."
              )}
            </h1>
          </div>
        </div>

        <form onSubmit={handleLogin} noValidate style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="stagger" style={{ flex: 1, padding: "28px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>
            <label className="lbl" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              Email
              <input
                className={fieldCls(emailShake)}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                aria-invalid={emailShake.error || undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  emailShake.clear();
                }}
              />
            </label>
            <label className="lbl" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              Password
              <input
                className={fieldCls(passShake)}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                aria-invalid={passShake.error || undefined}
                onChange={(e) => {
                  setPassword(e.target.value);
                  passShake.clear();
                }}
              />
            </label>
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#4A433B" }}>{studio ? "Only the studio owner can sign in here." : "Your commissions, in one place."}</span>
              <Link href="/forgot-password" className="lnk" style={{ padding: "12px 0", flex: "none" }}>
                Forgot password?
              </Link>
            </span>
            {reset && !error && (
              <p role="status" style={{ margin: 0, fontSize: 13, color: "#1F4D24", fontWeight: 600 }}>
                Password updated. Sign in with your new password.
              </p>
            )}
            {verified && !error && (
              <p role="status" style={{ margin: 0, fontSize: 13, color: "#1F4D24", fontWeight: 600 }}>
                Email verified. You can sign in now.
              </p>
            )}
            {error && (
              <p role="alert" className="errmsg" style={{ margin: 0 }}>
                {error}
              </p>
            )}
          </div>

          <div style={{ padding: "12px 20px calc(20px + env(safe-area-inset-bottom, 0px))" }}>
            <Cta type="submit" loading={loading} arrow>
              {studio ? "Sign in to the studio" : "Sign in"}
            </Cta>
            <p style={{ margin: "6px 0 0", textAlign: "center", fontSize: 14, color: "#4A433B" }}>
              New here?{" "}
              <Link href="/signup" className="lnk" style={{ padding: "12px 4px", display: "inline-block" }}>
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </section>
    </LightPage>
  );
}
