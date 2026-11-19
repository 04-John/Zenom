"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { initials } from "@/lib/zenom-mobile";
import { Cta, Sheet } from "@/components/mobile/ui";

/** "Sign out?" confirmation sheet → signOut({ callbackUrl: "/" }). */
export function SignOutSheet({ open, onClose, name, detail }: { open: boolean; onClose: () => void; name: string; detail: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} label="Sign out?">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: "#12100E", color: "#E58A52", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flex: "none" }}>
            {initials(name)}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <strong style={{ fontSize: 15 }}>{name}</strong>
            <span style={{ fontSize: 12, color: "#4A433B", overflowWrap: "anywhere" }}>{detail}</span>
          </span>
        </span>
        <p className="sub" style={{ fontSize: 14 }}>
          You&apos;ll need to sign in again to see your orders and documents.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <button type="button" className="sec" onClick={onClose}>
            Cancel
          </button>
          <Cta
            tone="danger"
            loading={busy}
            onClick={() => {
              setBusy(true);
              void signOut({ callbackUrl: "/" });
            }}
            style={{ height: 52, fontSize: 15 }}
          >
            Sign out
          </Cta>
        </div>
      </div>
    </Sheet>
  );
}
