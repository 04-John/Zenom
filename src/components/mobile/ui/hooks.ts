"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * State persisted in localStorage (per browser). For preferences that have no
 * backend field yet (alert switches, currency/unit display, read markers).
 * Renders `initial` on the server and first client paint, then the stored value.
 */
export function useLocalState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* storage unavailable: keep the default */
    }
    setReady(true);
  }, [key]);
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key]
  );
  return [value, set, ready];
}

/**
 * Re-runs the current server component tree every `ms` while the tab is
 * visible (router.refresh keeps client state). Used to notice new orders and
 * status changes without a socket.
 */
export function useAutoRefresh(ms = 45_000, enabled = true) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(tick, ms);
    const onVisible = () => document.visibilityState === "visible" && router.refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, ms, enabled]);
}

/**
 * Required-field shake. `shake()` returns the next error class, alternating
 * err-a / err-b so the animation replays on every failed attempt; `clear()`
 * resets. Use: <input className={"field " + cls} />
 */
export function useShake(): { cls: string; error: boolean; shake: () => void; clear: () => void } {
  const [n, setN] = useState(0);
  return {
    cls: n === 0 ? "" : n % 2 ? "err-a" : "err-b",
    error: n > 0,
    shake: () => setN((x) => x + 1),
    clear: () => setN(0),
  };
}

/** A "Saved" tick that flashes for 1.2s each time `flash()` is called. */
export function useSavedFlash(ms = 1200): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const t = useRef<number>();
  useEffect(() => () => window.clearTimeout(t.current), []);
  const flash = useCallback(() => {
    window.clearTimeout(t.current);
    setOn(true);
    t.current = window.setTimeout(() => setOn(false), ms);
  }, [ms]);
  return [on, flash];
}

/** Copies text; resolves false when the clipboard is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
