"use client";

import { useEffect, useState } from "react";
import type { DbCategory } from "@/lib/pricing";

// Small client-side glue shared by the studio screens.

export const ART_CATEGORIES: DbCategory[] = ["PORTRAIT", "GEOMETRIC", "MINIMALISTIC", "FIGURATIVE"];

/** sessionStorage: id of the artwork the form just saved (the list flashes that row once). */
export const FLASH_KEY = "zs.studio.flashArt";
/** sessionStorage: the filtered list URLs, so "‹ Orders" / "‹ Artworks" return to the same filters. */
export const ORDERS_BACK_KEY = "zs.studio.ordersBack";
export const ARTWORKS_BACK_KEY = "zs.studio.artworksBack";

/** `fallback` on the server and first paint, then the remembered list URL (if it is one of `base`). */
export function useBackHref(fallback: string, key: string, base: string): string {
  const [href, setHref] = useState(fallback);
  useEffect(() => {
    if (fallback !== base) return;
    try {
      const u = sessionStorage.getItem(key);
      if (u && (u === base || u.startsWith(base + "?"))) setHref(u);
    } catch {
      /* storage unavailable */
    }
  }, [fallback, key, base]);
  return href;
}

export function remember(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}
