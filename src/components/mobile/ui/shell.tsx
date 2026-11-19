"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ZenomMark } from "@/components/brand/ZenomMark";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

/**
 * Root of a light-app page. `.m` scopes the light styles; `.m-page` paints the
 * ground (and the overscroll area) #FAF7F2. Content sits in a phone-width
 * column, so tablets and desktop get a centred column.
 *
 *   desktop="hide"   – the route has an existing desktop design: this tree is
 *                      only shown below 900px (render the desktop tree next to it
 *                      wrapped in `max-[900px]:hidden`).
 *   desktop="column" – new route with no desktop design: shown at every width.
 */
export function LightPage({
  children,
  desktop = "hide",
  tabBar = false,
  className = "",
}: {
  children: ReactNode;
  desktop?: "hide" | "column";
  /** leave room for the fixed tab bar */
  tabBar?: boolean;
  className?: string;
}) {
  return (
    <div className={`m m-page ${desktop === "hide" ? "min-[900px]:hidden" : ""} ${className}`}>
      <div
        className="mx-auto flex w-full max-w-[560px] flex-col"
        style={{ minHeight: "100dvh", paddingBottom: tabBar ? "calc(84px + env(safe-area-inset-bottom, 0px))" : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

/** Tab-home header: small kicker over a 32px italic title, round buttons on the right. */
export function TabHeader({ kicker, title, right }: { kicker: ReactNode; title: ReactNode; right?: ReactNode }) {
  return (
    <header
      className="hdr"
      style={{ padding: "calc(var(--m-top) + 16px) 20px 10px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: "#4A433B" }}>{kicker}</span>
        <h1 className="h1" style={{ fontSize: 32 }}>
          {title}
        </h1>
      </span>
      {right && <span style={{ display: "flex", gap: 8 }}>{right}</span>}
    </header>
  );
}

/** Sub-screen top row: rust "‹ Back" link on the left, optional controls on the right. */
export function BackBar({ href, onClick, label, right }: { href?: string; onClick?: () => void; label: string; right?: ReactNode }) {
  const style: React.CSSProperties = {
    border: 0,
    background: "none",
    display: "flex",
    alignItems: "center",
    gap: 4,
    font: "600 15px 'Instrument Sans', sans-serif",
    color: "#9A4A1F",
    cursor: "pointer",
    padding: "10px 0",
    minHeight: 44,
    textDecoration: "none",
  };
  const inner = (
    <>
      <Icon name="back" size={18} stroke={2} />
      {label}
    </>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: "var(--m-top)" }}>
      {href ? (
        <Link href={href} style={style} aria-label={`Back to ${label}`}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} style={style} aria-label={`Back to ${label}`}>
          {inner}
        </button>
      )}
      {right}
    </div>
  );
}

export type TabItem = {
  href: string;
  label: string;
  icon: IconName;
  /** active only on an exact pathname match (e.g. /studio) */
  exact?: boolean;
  /** extra path prefixes that also light this tab */
  also?: string[];
  badge?: number;
};

/** Fixed bottom tab bar (.tbi), active tab in rust. */
export function TabBar({ items, label = "Tabs" }: { items: TabItem[]; label?: string }) {
  const pathname = usePathname() ?? "";
  const isOn = (t: TabItem) => {
    const hit = (p: string) => (t.exact ? pathname === p : pathname === p || pathname.startsWith(p + "/"));
    return hit(t.href) || (t.also ?? []).some((p) => pathname === p || pathname.startsWith(p + "/"));
  };
  return (
    <nav
      aria-label={label}
      className="m"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        margin: "0 auto",
        maxWidth: 560,
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        padding: "6px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
        background: "rgba(255,255,255,.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid #EFEAE2",
      }}
    >
      {items.map((t) => {
        const on = isOn(t);
        return (
          <Link key={t.href} href={t.href} className={"tbi" + (on ? " on" : "")} aria-current={on ? "page" : undefined}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              <Icon name={t.icon} size={22} />
              {!!t.badge && t.badge > 0 && (
                <span className="bdg y" style={{ top: -6, right: -12 }} aria-label={`${t.badge} new`}>
                  {t.badge}
                </span>
              )}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * iOS-style push banner (.notif) that springs down from the top. Shows when
 * `show` flips true, hides itself after `autoHideMs`.
 */
export function PushBanner({
  show,
  title,
  body,
  href,
  onOpen,
  onHide,
  autoHideMs = 5000,
}: {
  show: boolean;
  title: string;
  body: string;
  href?: string;
  onOpen?: () => void;
  onHide: () => void;
  autoHideMs?: number;
}) {
  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(onHide, autoHideMs);
    return () => window.clearTimeout(t);
  }, [show, autoHideMs, onHide]);

  const content = (
    <>
      <span style={{ width: 38, height: 38, flex: "none", borderRadius: 10, background: "#12100E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ZenomMark size={24} ink="#ffffff" title="" />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", color: "#4A433B" }}>ZENOM STUDIO</span>
        <strong style={{ fontSize: 14 }}>{title}</strong>
        <span style={{ fontSize: 12, color: "#4A433B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{body}</span>
      </span>
      <span style={{ fontSize: 11, color: "#6E665C", alignSelf: "flex-start" }}>now</span>
    </>
  );
  const cls = "notif" + (show ? " on" : "");
  return (
    <div className="m" aria-live="polite">
      {href ? (
        <Link href={href} className={cls} aria-hidden={!show} tabIndex={show ? 0 : -1} onClick={() => { onOpen?.(); onHide(); }}>
          {content}
        </Link>
      ) : (
        <button type="button" className={cls} aria-hidden={!show} tabIndex={show ? 0 : -1} onClick={() => { onOpen?.(); onHide(); }}>
          {content}
        </button>
      )}
    </div>
  );
}

/** White rounded list container used for rows (.mrow / .drow). */
export function ListCard({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#ffffff", border: "1px solid #E8E2D8", borderRadius: 18, overflow: "hidden", ...style }}>{children}</div>;
}

/** Search field pill (light app). */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 14px", borderRadius: 999, background: "#ffffff", border: "1px solid #E8E2D8", flex: 1, minWidth: 0 }}>
      <Icon name="search" size={16} stroke={2} style={{ color: "#4A433B", flex: "none" }} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        style={{ flex: 1, minWidth: 0, border: 0, outline: "none", background: "none", font: "400 16px 'Instrument Sans', sans-serif", color: "#1A1714" }}
      />
    </label>
  );
}
