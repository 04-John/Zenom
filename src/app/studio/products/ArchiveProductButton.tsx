"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZenomSpinner } from "@/components/brand/ZenomSpinner";
import { useToast } from "@/components/ui/Toast";

// "Archiving" sets status back to DRAFT rather than deleting the row —
// existing orders reference this product (OrderItem.productId has no
// onDelete: Cascade), so a hard delete would break order history. DRAFT
// is already excluded from the public storefront query, so this is
// functionally a one-click unpublish/republish.
export function ArchiveProductButton({ productId, status }: { productId: string; status: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isArchived = status === "DRAFT";

  async function handleClick() {
    setLoading(true);
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: isArchived ? "AVAILABLE" : "DRAFT" }),
    });
    setLoading(false);

    if (!res.ok) {
      toast("Couldn't update this product.", "error");
      return;
    }

    toast(isArchived ? "Product restored to Available." : "Product archived.");
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-ink-2 underline hover:text-ember disabled:opacity-50"
    >
      {loading ? (
        <span className="inline-flex min-w-[52px] justify-center">
          <ZenomSpinner size={20} />
        </span>
      ) : isArchived ? (
        "Restore"
      ) : (
        "Archive"
      )}
    </button>
  );
}
