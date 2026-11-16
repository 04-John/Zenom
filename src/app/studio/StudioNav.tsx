"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/studio", label: "Overview", exact: true },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/products", label: "Artworks" },
];

export function StudioNav({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4" aria-label="Studio">
      <div className="flex flex-wrap items-center gap-2">
        {LINKS.map((l) => {
          const on = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-pill px-4 py-2 text-sm font-medium transition-colors ${
                on ? "bg-ink text-night" : "text-ink-2 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-4 text-sm text-ink-2">
        <span className="hidden sm:inline">Signed in as {name}</span>
        <Link href="/" className="underline hover:text-ember">
          View site
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="underline hover:text-ember">
          Sign out
        </button>
      </div>
    </nav>
  );
}
