"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-pill border border-ink/20 px-5 py-[11px] text-[13px] text-ink transition-colors hover:border-ember hover:text-ember"
    >
      Sign out
    </button>
  );
}
