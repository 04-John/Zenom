"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// Products can be pre-seeded under pillar ABSTRACT / SPACES with status
// COMING_SOON while those pillars are gated — the storefront query for
// those pillars filters to AVAILABLE only, so this never leaks early.
export function ProductForm({ initial }: { initial?: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    basePrice: initial?.basePrice ? initial.basePrice / 100 : 0,
    pillar: initial?.pillar ?? "PORTRAITS",
    status: initial?.status ?? "DRAFT",
    archiveCode: initial?.archiveCode ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(initial ? `/api/products/${initial.id}` : "/api/products", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, basePrice: Math.round(form.basePrice * 100) }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const message = body.error ?? "Something went wrong.";
      setError(message);
      toast(message, "error");
      setSaving(false);
      return;
    }

    toast(initial ? "Product updated." : "Product created.");
    router.push("/studio/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
      <Field label="Archive Code (e.g. ZS-001)" value={form.archiveCode} onChange={(v) => setForm({ ...form, archiveCode: v })} />
      <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
      <Field label="Base Price (₦)" type="number" value={String(form.basePrice)} onChange={(v) => setForm({ ...form, basePrice: Number(v) })} />

      <label className="block">
        <span className="text-sm font-medium text-navy">Pillar</span>
        <select
          value={form.pillar}
          onChange={(e) => setForm({ ...form, pillar: e.target.value })}
          className="mt-1 w-full rounded-btn border border-charcoal/20 p-3 text-sm"
        >
          <option value="PORTRAITS">Portraits</option>
          <option value="ABSTRACT">Abstract (pre-seed, gated)</option>
          <option value="SPACES">Spaces (pre-seed, gated)</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-navy">Status</span>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="mt-1 w-full rounded-btn border border-charcoal/20 p-3 text-sm"
        >
          <option value="DRAFT">Draft</option>
          <option value="AVAILABLE">Available</option>
          <option value="SOLD_OUT">Sold Out</option>
          <option value="COMING_SOON">Coming Soon</option>
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" loading={saving}>
        Save Product
      </Button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", textarea }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-navy">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="mt-1 w-full rounded-btn border border-charcoal/20 p-3 text-sm" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-btn border border-charcoal/20 p-3 text-sm" />
      )}
    </label>
  );
}
