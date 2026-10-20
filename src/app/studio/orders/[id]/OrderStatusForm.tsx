"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZenomSpinner } from "@/components/brand/ZenomSpinner";
import { statusLabel } from "../../StatusBadge";

const STATUSES = ["PENDING", "AWAITING_DEPOSIT", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"];

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
    <div className="mt-8">
      <label htmlFor="order-status" className="label-mono">
        Status
      </label>
      <div className="mt-2 flex items-center gap-3">
      <select
        id="order-status"
        value={status}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={saving}
        className="field block disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s === "AWAITING_DEPOSIT" ? "Awaiting deposit" : statusLabel(s)}
          </option>
        ))}
      </select>
      {saving && <ZenomSpinner size={20} />}
      </div>
    </div>
  );
}
