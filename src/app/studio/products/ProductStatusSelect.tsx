"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

// One-click stock control: set a piece Available / Sold out / Coming soon / Draft
// straight from the list.
export function ProductStatusSelect({ productId, status }: { productId: string; status: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    const prev = value;
    setValue(next);
    setBusy(true);
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (!res.ok) {
      setValue(prev);
      toast("Couldn't update this artwork.", "error");
      return;
    }
    toast("Status updated.");
    router.refresh();
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      aria-label="Artwork status"
      className="rounded-pill border border-ink/20 bg-transparent px-3 py-1.5 text-xs text-ink disabled:opacity-50"
    >
      <option value="AVAILABLE">Available</option>
      <option value="SOLD_OUT">Sold out</option>
      <option value="COMING_SOON">Coming soon</option>
      <option value="DRAFT">Draft (hidden)</option>
    </select>
  );
}
