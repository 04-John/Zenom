"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Sheet } from "./Sheet";
import { Cta } from "./controls";
import { useLightToast } from "./LightToast";

// "Change password" sheet (customer Settings and the studio tab). Needs the
// current password; POSTs to /api/account/password, which signs out every
// session (other phones and computers included). This device then signs
// straight back in with the new password, so only the others are signed out.
export function ChangePasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { say } = useLightToast();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCurrent("");
    setNext("");
    setRepeat("");
    setError(null);
  };
  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!current) return setError("Enter your current password.");
    if (next.length < 8) return setError("Your new password needs at least 8 characters.");
    if (next !== repeat) return setError("The two new passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't change your password. Try again.");
      const again = await signIn("credentials", { email: body.email, password: next, redirect: false });
      if (!again?.ok) {
        window.location.href = "/login";
        return;
      }
      reset();
      onClose();
      say("Password changed · other devices signed out");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change your password. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <label htmlFor={id} className="lbl" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label}
      <input
        id={id}
        className={"field" + (error ? " err-a" : "")}
        type="password"
        autoComplete={autoComplete}
        maxLength={72}
        value={value}
        onChange={(e) => {
          set(e.target.value);
          setError(null);
        }}
      />
    </label>
  );

  return (
    <Sheet open={open} onClose={close} label="Change password">
      <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {field("pw-current", "Current password", current, setCurrent, "current-password")}
        {field("pw-new", "New password", next, setNext, "new-password")}
        {field("pw-repeat", "Repeat the new password", repeat, setRepeat, "new-password")}
        {error && (
          <p role="alert" className="errmsg" style={{ margin: 0 }}>
            {error}
          </p>
        )}
        <Cta type="submit" loading={busy}>
          Save new password
        </Cta>
        <p className="sub" style={{ fontSize: 13 }}>
          Forgotten it? <a href="/forgot-password" className="lnk" style={{ padding: 0 }}>Get a reset link by email</a>.
        </p>
      </form>
    </Sheet>
  );
}
