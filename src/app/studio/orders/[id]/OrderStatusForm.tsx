"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"];

export function OrderStatusForm({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    setStatus(newStatus);
    setSaving(true);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <label className="text-sm font-medium text-navy">Status</label>
      <select
        value={status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={saving}
        className="mt-1 block w-full rounded-btn border border-charcoal/20 p-3 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
