"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-sm px-6 py-24">
        <h1 className="font-display text-3xl text-navy">Check your email</h1>
        <p className="mt-4 text-sm text-charcoal/70">
          We&rsquo;ve sent a verification link to {form.email}. Click it to activate your account, then sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="font-display text-3xl text-navy">Create Account</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          placeholder="Full name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-btn border border-charcoal/20 p-3 text-sm focus:border-copper focus:outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-btn border border-charcoal/20 p-3 text-sm focus:border-copper focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded-btn border border-charcoal/20 p-3 text-sm focus:border-copper focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
        <p className="text-xs text-charcoal/50">
          By creating an account you agree to our{" "}
          <a href="/terms" className="text-copper underline">Terms of Service</a> and{" "}
          <a href="/privacy" className="text-copper underline">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}
