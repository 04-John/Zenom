"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PushBanner, Sheet, TabBar, useAutoRefresh, useLocalState, type TabItem } from "@/components/mobile/ui";
import type { StudioNewest, StudioNotice } from "@/lib/studio-stats";
import { Thumb } from "./Thumb";

export type StudioAlertPrefs = { newRequest: boolean; deposit: boolean; daily: boolean };
const DEFAULT_PREFS: StudioAlertPrefs = { newRequest: true, deposit: true, daily: false };

type Ctx = {
  unread: number;
  openNotifications: () => void;
  prefs: StudioAlertPrefs;
  setPref: (k: keyof StudioAlertPrefs, v: boolean) => void;
  /** order ids that arrived while this tab was open (rows flash in) */
  freshIds: ReadonlySet<string>;
};

const StudioCtx = createContext<Ctx>({
  unread: 0,
  openNotifications: () => {},
  prefs: DEFAULT_PREFS,
  setPref: () => {},
  freshIds: new Set(),
});

export const useStudio = () => useContext(StudioCtx);

// Tab homes show the bottom tab bar; sub-screens (order detail, artwork form) use a BackBar instead.
const TAB_ROUTES = ["/studio", "/studio/orders", "/studio/products", "/studio/settings"];
const TABS = (pending: number): TabItem[] => [
  { href: "/studio", label: "Overview", icon: "overview", exact: true },
  { href: "/studio/orders", label: "Orders", icon: "orders", badge: pending },
  { href: "/studio/products", label: "Artworks", icon: "artworks" },
  { href: "/studio/settings", label: "Studio", icon: "studio" },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899.98px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

/**
 * The light studio app's shared chrome, mounted once by app/studio/layout.tsx:
 * bottom tab bar (tab homes only), notifications sheet, "new request" push
 * banner and a quiet auto-refresh. Everything here is below 900px only; the
 * desktop studio is untouched.
 */
export function StudioMobileProvider({
  children,
  pendingCount,
  notices,
  newest,
  live = true,
}: {
  children: ReactNode;
  pendingCount: number;
  notices: StudioNotice[];
  newest: StudioNewest[];
  /** false when the server could not load orders: nothing is recorded or announced */
  live?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const isMobile = useIsMobile();
  const onTab = TAB_ROUTES.includes(pathname);
  const onForm = pathname.startsWith("/studio/products/"); // new / edit artwork: never refresh under a form

  useAutoRefresh(40_000, isMobile && !onForm);

  /* ── alert switches (per browser; only "new request" does something today) ── */
  const [prefs, setPrefs, prefsReady] = useLocalState<StudioAlertPrefs>("zs.studio.alerts", DEFAULT_PREFS);
  const setPref = useCallback((k: keyof StudioAlertPrefs, v: boolean) => setPrefs((p) => ({ ...DEFAULT_PREFS, ...p, [k]: v })), [setPrefs]);

  /* ── notifications: derived from live orders, read markers in localStorage ── */
  const [read, setRead, readReady] = useLocalState<string[]>("zs.studio.readNotices", []);
  const [sheet, setSheet] = useState(false);
  const unread = readReady ? notices.filter((n) => !read.includes(n.key)).length : 0;
  const markRead = (keys: string[]) => setRead((prev) => Array.from(new Set([...keys, ...prev])).slice(0, 300));

  /* ── push banner: a new order id this browser has not seen before ── */
  const [seen, setSeen, seenReady] = useLocalState<string[] | null>("zs.studio.seenOrders", null);
  const [banner, setBanner] = useState<StudioNewest | null>(null);
  const [freshIds, setFreshIds] = useState<ReadonlySet<string>>(() => new Set());
  const newestKey = newest.map((n) => n.id).join(",");

  useEffect(() => {
    if (!live || !seenReady || !prefsReady) return;
    if (seen === null) {
      // First visit in this browser: remember what exists, announce nothing.
      setSeen(newest.map((n) => n.id));
      return;
    }
    const fresh = newest.filter((n) => !seen.includes(n.id));
    if (!fresh.length) return;
    setSeen((prev) => [...fresh.map((f) => f.id), ...(prev ?? [])].slice(0, 200));
    setFreshIds((s) => new Set([...Array.from(s), ...fresh.map((f) => f.id)]));
    if (prefs.newRequest && window.matchMedia("(max-width: 899.98px)").matches) setBanner(fresh[0]);
    // newestKey stands in for `newest` (a new array on every refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, seenReady, prefsReady, newestKey]);

  const hideBanner = useCallback(() => setBanner(null), []);

  const value = useMemo<Ctx>(
    () => ({ unread, openNotifications: () => setSheet(true), prefs, setPref, freshIds }),
    [unread, prefs, setPref, freshIds]
  );

  return (
    <StudioCtx.Provider value={value}>
      {children}
      <div className="min-[900px]:hidden">
        {onTab && <TabBar items={TABS(pendingCount)} label="Studio tabs" />}
        <PushBanner
          show={!!banner}
          title={banner?.title ?? "New commission request"}
          body={banner?.body ?? ""}
          href={banner ? `/studio/orders/${banner.id}` : undefined}
          onHide={hideBanner}
        />
      </div>
      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        label="Notifications"
        actions={
          notices.length > 0 && unread > 0 ? (
            <button type="button" className="lnk" onClick={() => markRead(notices.map((n) => n.key))}>
              Mark all read
            </button>
          ) : undefined
        }
      >
        {notices.length === 0 ? (
          <p className="sub" style={{ fontSize: 14, padding: "8px 4px 12px" }}>
            You&rsquo;re all caught up. New requests, deposits that are due and orders ready for delivery show up here.
          </p>
        ) : (
          <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {notices.map((n) => {
              const isUnread = readReady && !read.includes(n.key);
              return (
                <Link
                  key={n.key}
                  href={`/studio/orders/${n.orderId}`}
                  className={"ni" + (isUnread ? " unread" : "")}
                  onClick={() => {
                    markRead([n.key]);
                    setSheet(false);
                  }}
                >
                  <Thumb src={n.image} w={36} h={44} />
                  <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <strong style={{ fontSize: 14 }}>{n.title}</strong>
                    <span style={{ fontSize: 12, color: "#4A433B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.body}</span>
                    <span style={{ fontSize: 11, color: "#6E665C" }}>{n.when}</span>
                  </span>
                  {isUnread && (
                    <>
                      <span className="dotu" aria-hidden="true" />
                      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Unread</span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </Sheet>
    </StudioCtx.Provider>
  );
}
