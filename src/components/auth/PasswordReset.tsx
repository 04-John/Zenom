"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { Button, buttonClass } from "@/components/ui/Button";
import { Cta, LightPage } from "@/components/mobile/ui";
import { art } from "@/lib/catalog";

// Forgot password (/forgot-password) and choose a new one (/reset-password).
// Same logic, two looks: the dark storefront panel from 900px up, the light
// app screen (like MobileSignIn) below 900px. Each page renders both; CSS
// shows one.

type Mode = { kind: "forgot" } | { kind: "reset"; token: string | null };
type Variant = "dark" | "light";

function useResetFlow(mode: Mode) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: { email?: string; password?: string; confirm?: string }) {
    if (busy) return;
    setError(null);
    if (mode.kind === "reset") {
      if ((values.password ?? "").length < 8) return setError("Choose a password of at least 8 characters.");
      if (values.password !== values.confirm) return setError("The two passwords don't match.");
    } else if (!/^\S+@\S+\.\S+$/.test((values.email ?? "").trim())) {
      return setError("Enter the email you signed up with.");
    }
    setBusy(true);
    try {
      const res = await fetch(mode.kind === "forgot" ? "/api/auth/forgot-password" : "/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode.kind === "forgot" ? { email: values.email?.trim() } : { token: mode.token, password: values.password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, done, error, submit };
}

const COPY = {
  forgot: {
    kicker: "MY ACCOUNT",
    title: "Forgot your password?",
    blurb: "Enter the email you signed up with and we'll send you a link to choose a new one.",
    cta: "Send the link",
    doneTitle: "Check your email.",
    doneBody: "If an account uses that address, a reset link is on its way. It works once and expires in 1 hour. Check your spam folder if it doesn't arrive.",
  },
  reset: {
    kicker: "MY ACCOUNT",
    title: "Choose a new password.",
    blurb: "At least 8 characters. You'll use it to sign in from now on.",
    cta: "Save new password",
    doneTitle: "Password updated.",
    doneBody: "You can sign in with your new password now.",
  },
};

export function PasswordReset({ mode }: { mode: Mode }) {
  return (
    <>
      <div className="max-[900px]:hidden">
        <ResetView mode={mode} variant="dark" />
      </div>
      <LightPage desktop="hide">
        <ResetView mode={mode} variant="light" />
      </LightPage>
    </>
  );
}

function ResetView({ mode, variant }: { mode: Mode; variant: Variant }) {
  const flow = useResetFlow(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const copy = COPY[mode.kind];
  const badLink = mode.kind === "reset" && !mode.token;
  const id = (s: string) => `${variant}-${mode.kind}-${s}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await flow.submit({ email, password, confirm });
  };
  const errorShown = flow.error;

  const title = badLink ? "This link doesn't work." : flow.done ? copy.doneTitle : copy.title;
  const body = badLink
    ? "The reset link is incomplete. Ask for a new one below."
    : flow.done
      ? copy.doneBody
      : copy.blurb;

  const fields =
    mode.kind === "forgot" ? (
      <FieldRow variant={variant} id={id("email")} label="Email" error={!!errorShown}>
        {(cls) => (
          <input id={id("email")} className={cls} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
      </FieldRow>
    ) : (
      <>
        <FieldRow variant={variant} id={id("pw")} label="New password" error={!!errorShown}>
          {(cls) => <input id={id("pw")} className={cls} type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(e) => setPassword(e.target.value)} />}
        </FieldRow>
        <FieldRow variant={variant} id={id("pw2")} label="Repeat it" error={!!errorShown}>
          {(cls) => <input id={id("pw2")} className={cls} type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </FieldRow>
      </>
    );

  const showForm = !flow.done && !badLink;
  const errorEl = errorShown && (
    <p role="alert" className={variant === "dark" ? "text-sm text-red-400" : "errmsg"} style={variant === "light" ? { margin: 0 } : undefined}>
      {errorShown}
    </p>
  );

  if (variant === "dark") {
    return (
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-6 pb-36 pt-[150px] min-[900px]:grid-cols-2">
        <div className="relative min-h-[420px] overflow-hidden rounded-card bg-night-raised min-[900px]:min-h-[520px]">
          <Image src={art("w02")} alt="" fill sizes="560px" className="object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-night from-5% to-night/0 to-60%" />
        </div>
        <div className="max-w-[440px]">
          {flow.done && (
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-ember" aria-hidden>
              <Check size={28} strokeWidth={2.4} className="text-night" />
            </div>
          )}
          <p className="kicker">{copy.kicker}</p>
          <h1 className="mt-4 font-display text-[clamp(44px,5vw,60px)] italic leading-[0.95]" role={flow.done ? "status" : undefined}>
            {title}
          </h1>
          <p className="mt-4 text-[15px] leading-[1.7] text-ink-2">{body}</p>
          {showForm && (
            <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-3">
              {fields}
              {errorEl}
              <Button type="submit" loading={flow.busy} className="mt-2 w-full py-[15px] text-[15px]">
                {copy.cta}
              </Button>
            </form>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {flow.done && mode.kind === "reset" ? (
              <Link href="/login?reset=1" className={buttonClass("ember")}>
                Sign in
              </Link>
            ) : badLink ? (
              <Link href="/forgot-password" className={buttonClass("primary")}>
                Ask for a new link
              </Link>
            ) : (
              <Link href="/login" className="text-sm text-ink-2 underline hover:text-ember">
                Back to sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="intro-in" style={{ flex: 1, minHeight: "100dvh", background: "#ffffff", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: "min(250px, 34dvh)", minHeight: 200, flex: "none", background: "#12100E", overflow: "hidden", borderRadius: "0 0 32px 32px" }}>
        <Image src={art("w02")} alt="" fill sizes="(max-width: 560px) 100vw, 560px" style={{ objectFit: "cover", opacity: 0.5 }} />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(18,16,14,.4), rgba(18,16,14,.92))" }} />
        <Link href="/login" className="lnk" style={{ position: "absolute", top: "calc(var(--m-top) + 4px)", left: 16, color: "#ffffff", display: "flex", alignItems: "center", minHeight: 44 }}>
          ‹ Sign in
        </Link>
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, color: "#ffffff", display: "flex", flexDirection: "column", gap: 10 }}>
          <span aria-hidden="true" style={{ display: "block", width: 36, height: 36 }}>
            <ZenomMark size={36} ink="#ffffff" title="" />
          </span>
          <h1 role={flow.done ? "status" : undefined} style={{ margin: 0, fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, fontSize: 34, lineHeight: 1.02 }}>
            {title}
          </h1>
        </div>
      </div>
      <div className="stagger" style={{ flex: 1, padding: "24px 20px calc(28px + var(--m-bottom))", display: "flex", flexDirection: "column", gap: 16 }}>
        <p className="sub">{body}</p>
        {showForm && (
          <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fields}
            {errorEl}
            <Cta type="submit" loading={flow.busy} arrow>
              {copy.cta}
            </Cta>
          </form>
        )}
        {flow.done && mode.kind === "reset" && (
          <Cta href="/login?reset=1" tone="ember" arrow>
            Sign in
          </Cta>
        )}
        {badLink && (
          <Cta href="/forgot-password" arrow>
            Ask for a new link
          </Cta>
        )}
      </div>
    </section>
  );
}

function FieldRow({
  variant,
  id,
  label,
  error,
  children,
}: {
  variant: Variant;
  id: string;
  label: string;
  error: boolean;
  children: (cls: string) => React.ReactNode;
}) {
  if (variant === "dark") {
    return (
      <label htmlFor={id} className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2">{label}</span>
        {children("field")}
      </label>
    );
  }
  return (
    <label htmlFor={id} className="lbl" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {label}
      {children("field" + (error ? " err-a" : ""))}
    </label>
  );
}
