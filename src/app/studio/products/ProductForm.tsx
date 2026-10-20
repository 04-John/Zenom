"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZenomSpinner } from "@/components/brand/ZenomSpinner";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

// The pillar (Portraits / Abstract) is derived from the category on the
// server; the category also decides which price table applies.
export function ProductForm({ initial }: { initial?: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? "PORTRAIT",
    status: initial?.status ?? "DRAFT",
    archiveCode: initial?.archiveCode ?? "",
    imageUrl: initial?.images?.[0]?.url ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const sigRes = await fetch("/api/uploads/signature", { method: "POST" });
      if (!sigRes.ok) {
        const body = await sigRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't prepare the upload.");
      }
      const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", apiKey);
      uploadData.append("timestamp", String(timestamp));
      uploadData.append("signature", signature);
      uploadData.append("folder", folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: uploadData,
      });
      if (!uploadRes.ok) throw new Error("Image upload failed.");

      const uploaded = await uploadRes.json();
      setForm((f) => ({ ...f, imageUrl: uploaded.secure_url }));
      toast("Image uploaded.");
    } catch (err: any) {
      const message = err.message ?? "Image upload failed.";
      setError(message);
      toast(message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(initial ? `/api/products/${initial.id}` : "/api/products", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        imageUrl: form.imageUrl || undefined,
      }),
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
      <p className="text-xs text-ink-3">
        No price field here — prices come from the category and size tables in src/lib/pricing.ts, never per-product.
      </p>

      <label className="block">
        <span className="label-mono">Product Image</span>
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary Cloudinary URL, not a storefront-optimized image
          <img src={form.imageUrl} alt="" className="mt-2 h-32 w-32 rounded-tile object-cover" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          disabled={uploading}
          className="mt-2 block w-full text-sm text-ink-2 file:mr-3 file:rounded-pill file:border file:border-ink/25 file:bg-transparent file:px-4 file:py-2 file:text-sm file:text-ink"
        />
        {uploading && (
          <div className="mt-2">
            <ZenomSpinner size={40} label="Uploading" />
          </div>
        )}
      </label>

      <label className="block">
        <span className="label-mono">Category</span>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="field mt-2"
        >
          <option value="PORTRAIT">Portrait (Portrait price table)</option>
          <option value="GEOMETRIC">Geometric (Abstract price table)</option>
          <option value="MINIMALISTIC">Minimalistic (Abstract price table)</option>
          <option value="FIGURATIVE">Figurative (Abstract price table)</option>
        </select>
      </label>

      <label className="block">
        <span className="label-mono">Status</span>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="field mt-2"
        >
          <option value="DRAFT">Draft</option>
          <option value="AVAILABLE">Available</option>
          <option value="SOLD_OUT">Sold Out</option>
          <option value="COMING_SOON">Coming Soon</option>
        </select>
      </label>

      {error && <p className="text-sm text-ember">{error}</p>}
      <Button type="submit" loading={saving} disabled={uploading}>
        Save Product
      </Button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", textarea }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="label-mono">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="field mt-2" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="field mt-2" />
      )}
    </label>
  );
}
