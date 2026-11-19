"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatNaira } from "@/lib/pricing";
import { Chip, HeaderButton, Icon, PushBanner, Sheet, TabBar, useAutoRefresh, useLocalState, type TabItem } from "@/components/mobile/ui";
import { needsAction, notifKey, notificationFor, orderLine, type CustomerOrder, type CustomerUser } from "./model";
import { useIsMobile } from "./hooks";

type SheetKind = "action" | "notif" | null;

type Ctx = {
  signedIn: boolean;
  user: CustomerUser;
  orders: CustomerOrder[];
  actionOrders: CustomerOrder[];
  unread: number;
  openSheet: (s: Exclude<SheetKind, null>) => void;
};

const CustomerContext = createContext<Ctx>({
  signedIn: false,
  user: { name: null, email: null },
  orders: [],
  actionOrders: [],
  unread: 0,
  openSheet: () => {},
});

export const useCustomer = () => useContext(CustomerContext);

const MONTH = 30 * 86_400_000;
const LAST_STATUS_KEY = "zs.lastStatus";

/**
 * Wraps every /account page (see src/app/account/layout.tsx). Below 900px and
 * for a signed-in customer it adds the light app's chrome: the bottom tab bar
 * (hidden on order detail), the "Needs your action" and notifications sheets,
 * the push banner for a newly ready quote, and a 45s auto-refresh so status
 * changes Samuel makes in the studio show up without a reload.
 */
export function CustomerChrome({
  signedIn,
  user,
  orders,
  children,
}: {
  signedIn: boolean;
  user: CustomerUser;
  orders: CustomerOrder[];
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const mobile = useIsMobile();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [read, setRead, readReady] = useLocalState<string[]>("zs.notifRead", []);
  const [banner, setBanner] = useState<CustomerOrder | null>(null);
  const [bannerOn, setBannerOn] = useState(false);

  useAutoRefresh(45_000, signedIn && mobile);

  const now = Date.now();
  const notifs = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    [orders]
  );
  const readSet = useMemo(() => new Set(read), [read]);
  // "Request received" is something the customer just did, and month-old
  // updates are history: neither starts out unread.
  const isUnread = useCallback(
    (o: CustomerOrder) => readReady && !readSet.has(notifKey(o)) && o.status !== "PENDING" && now - +new Date(o.updatedAt) < MONTH,
    [readReady, readSet, now]
  );
  const unread = notifs.filter(isUnread).length;
  const actionOrders = useMemo(() => orders.filter(needsAction), [orders]);

  const markRead = useCallback(
    (keys: string[]) => setRead((prev) => Array.from(new Set([...keys, ...prev])).slice(0, 300)),
    [setRead]
  );

  // Push banner: an order moved to AWAITING_DEPOSIT since this browser last
  // looked (statuses remembered in localStorage).
  useEffect(() => {
    if (!signedIn) return;
    let last: Record<string, string> = {};
    try {
      last = JSON.parse(localStorage.getItem(LAST_STATUS_KEY) || "{}");
    } catch {
      /* storage unavailable */
    }
    const hit = orders.find((o) => o.status === "AWAITING_DEPOSIT" && last[o.id] && last[o.id] !== "AWAITING_DEPOSIT");
    let raf = 0;
    if (hit && !window.location.pathname.startsWith(`/account/orders/${hit.id}`)) {
      setBanner(hit);
      // mount hidden first, then flip on, so the banner springs down
      raf = requestAnimationFrame(() => requestAnimationFrame(() => setBannerOn(true)));
    }
    try {
      localStorage.setItem(LAST_STATUS_KEY, JSON.stringify(Object.fromEntries(orders.map((o) => [o.id, o.status]))));
    } catch {
      /* ignore */
    }
    return () => cancelAnimationFrame(raf);
  }, [orders, signedIn]);

  const hideBanner = useCallback(() => setBannerOn(false), []);
  const openSheet = useCallback((s: Exclude<SheetKind, null>) => setSheet(s), []);
  const close = () => setSheet(null);

  const ctx = useMemo<Ctx>(
    () => ({ signedIn, user, orders, actionOrders, unread, openSheet }),
    [signedIn, user, orders, actionOrders, unread, openSheet]
  );

  // Orders is also lit on /account (the mobile Orders view lives there too).
  // TabBar's `also` matches prefixes, so /account is handled with an exact item.
  const tabs: TabItem[] = [
    pathname === "/account"
      ? { href: "/account", label: "Orders", icon: "orders", exact: true }
      : { href: "/account/orders", label: "Orders", icon: "orders" },
    { href: "/account/pricing", label: "Pricing", icon: "pricing" },
    { href: "/account/documents", label: "Documents", icon: "docs" },
    { href: "/account/profile", label: "Account", icon: "account", also: ["/account/settings", "/account/help"] },
  ];
  const subScreen = /^\/account\/orders\/[^/]+/.test(pathname);

  return (
    <CustomerContext.Provider value={ctx}>
      {children}
      {signedIn && (
        <div className="min-[900px]:hidden">
          {!subScreen && <TabBar items={tabs} label="Account tabs" />}
          {banner && (
            <PushBanner
              show={bannerOn}
              title="Your quote is ready"
              body={`${banner.orderNumber} · ${orderLine(banner)} · ${formatNaira(banner.total)}`}
              href={`/account/orders/${banner.id}`}
              onOpen={() => markRead([notifKey(banner)])}
              onHide={hideBanner}
            />
          )}

          <Sheet
            open={sheet === "action"}
            onClose={close}
            label="Needs your action"
            title={
              <strong style={{ fontSize: 20, display: "flex", alignItems: "center", gap: 8 }}>
                Needs your action <Chip bg="#E58A52" fg="#1A1714" style={{ height: 22 }}>{actionOrders.length}</Chip>
              </strong>
            }
          >
            <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {actionOrders.map((o) => (
                <Link key={o.id} href={`/account/orders/${o.id}`} className="ai" onClick={close}>
                  <span style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip bg="#FBEBDD" fg="#6B3214" style={{ height: 22, fontSize: 11 }}>Deposit due</Chip>
                    <span style={{ fontSize: 11, color: "#4A433B" }}>{o.orderNumber}</span>
                  </span>
                  <strong style={{ fontSize: 15 }}>{orderLine(o)}</strong>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#9A4A1F" }}>Pay deposit of {formatNaira(o.deposit)} →</span>
                </Link>
              ))}
              {actionOrders.length === 0 && (
                <p className="sub" style={{ padding: "12px 0", textAlign: "center" }}>
                  You&apos;re all caught up.
                </p>
              )}
            </div>
          </Sheet>

          <Sheet
            open={sheet === "notif"}
            onClose={close}
            label="Notifications"
            actions={
              notifs.length > 0 ? (
                <button type="button" className="lnk" onClick={() => markRead(notifs.map(notifKey))} style={{ minHeight: 44 }}>
                  Mark all read
                </button>
              ) : undefined
            }
          >
            <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {notifs.map((o) => {
                const n = notificationFor(o);
                const un = isUnread(o);
                return (
                  <Link
                    key={o.id}
                    href={`/account/orders/${o.id}`}
                    className={"ni" + (un ? " unread" : "")}
                    onClick={() => {
                      markRead([notifKey(o)]);
                      close();
                    }}
                  >
                    <span style={{ width: 36, height: 36, flex: "none", borderRadius: "50%", background: "#FBEBDD", display: "flex", alignItems: "center", justifyContent: "center", color: "#9A4A1F" }}>
                      <Icon name="bell" size={16} stroke={2} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      <strong style={{ fontSize: 14 }}>{n.title}</strong>
                      <span style={{ fontSize: 12, color: "#4A433B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.body}</span>
                      <span style={{ fontSize: 11, color: "#6E665C" }}>{o.updatedAgo}</span>
                    </span>
                    {un && (
                      <>
                        <span className="dotu" aria-hidden="true" />
                        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Unread</span>
                      </>
                    )}
                  </Link>
                );
              })}
              {notifs.length === 0 && (
                <p className="sub" style={{ padding: "12px 0", textAlign: "center" }}>
                  No updates yet. News about your orders shows up here.
                </p>
              )}
            </div>
          </Sheet>
        </div>
      )}
    </CustomerContext.Provider>
  );
}

/** The tray (needs your action) and bell (notifications) header buttons, plus an optional dark "+". */
export function CustomerHeaderButtons({ plus }: { plus?: boolean }) {
  const { actionOrders, unread, openSheet } = useCustomer();
  return (
    <>
      <HeaderButton label="Needs your action" icon="tray" badge={actionOrders.length} badgeTone="ember" onClick={() => openSheet("action")} />
      <HeaderButton label="Notifications" icon="bell" badge={unread} onClick={() => openSheet("notif")} />
      {plus && <HeaderButton label="New commission" icon="plus" dark stroke={2.2} href="/commission?start=1" />}
    </>
  );
}
