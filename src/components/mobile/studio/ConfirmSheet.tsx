"use client";

import type { ReactNode } from "react";
import { Cta, Sheet } from "@/components/mobile/ui";

/** Bottom-sheet confirmation: body text, a "Keep" secondary and a red primary that shrinks to a spinner. */
export function ConfirmSheet({
  open,
  onClose,
  title,
  body,
  cta,
  onConfirm,
  busy,
  keepLabel = "Keep",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  cta: string;
  onConfirm: () => void;
  busy?: boolean;
  keepLabel?: string;
}) {
  return (
    <Sheet open={open} onClose={busy ? () => {} : onClose} label={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p className="sub" style={{ fontSize: 14 }}>
          {body}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, alignItems: "center" }}>
          <button type="button" className="sec" onClick={onClose} disabled={busy}>
            {keepLabel}
          </button>
          <Cta tone="danger" onClick={onConfirm} loading={busy} style={{ height: 52, fontSize: 15 }}>
            {cta}
          </Cta>
        </div>
      </div>
    </Sheet>
  );
}
