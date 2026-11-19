"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isLightRoute } from "@/lib/light-routes";

// Hides the dark storefront chrome (nav, footer, grain, scroll progress) on
// light-app routes below 900px. Desktop always renders it. The decision uses
// the pathname, so it is already right in the server-rendered HTML.
export function MobileChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!isLightRoute(pathname)) return <>{children}</>;
  return <div className="max-[900px]:hidden">{children}</div>;
}
