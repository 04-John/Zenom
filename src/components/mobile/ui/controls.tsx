"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ARTWORK_STATUS, ORDER_CHIP, ORDER_LABEL, type ArtworkStatus, type OrderStatus } from "@/lib/zenom-mobile";
import { Icon, SpinArc } from "./Icon";
import type { IconName } from "./icons";

/* ── Switch (.sw) ── */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  /** accessible name */
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={"sw" + (checked ? " on" : "")}
      onClick={() => onChange(!checked)}
    />
  );
}

/** A labelled switch row (.swrow): title + helper text + switch. */
export function SwitchRow({
  title,
  body,
  checked,
  onChange,
  disabled,
  last,
}: {
  title: string;
  body?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <div className="swrow" style={last ? { borderBottom: 0 } : undefined}>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <strong style={{ fontSize: 15 }}>{title}</strong>
        {body && <span style={{ fontSize: 12, color: "#4A433B" }}>{body}</span>}
      </span>
      <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}

/* ── Segmented tabs with a sliding pill (.segpill/.segb), e.g. Quote/Payments/Progress/Docs ── */
export function SegTabs<K extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  const n = items.length;
  const idx = Math.max(0, items.findIndex((i) => i.key === value));
  return (
    <div
      role="tablist"
      aria-label={label}
      style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, padding: 3, borderRadius: 14, background: "#EFEAE2" }}
    >
      <span className="segpill" style={{ width: `calc((100% - 6px) / ${n})`, left: `calc(3px + ${idx} * ((100% - 6px) / ${n}))` }} />
      {items.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={t.key === value}
          className={"segb" + (t.key === value ? " on" : "")}
          onClick={() => onChange(t.key)}
          style={{ minHeight: 44 }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── Small segmented control (.sg2/.sg), e.g. range 7d/30d/90d/All or NGN/USD ── */
export function SegSmall<K extends string>({
  items,
  value,
  onChange,
  label,
  hrefFor,
}: {
  items: { key: K; label: string }[];
  value: K;
  onChange?: (k: K) => void;
  label: string;
  /** render links instead of buttons (server-driven state such as ?range=) */
  hrefFor?: (k: K) => string;
}) {
  return (
    <div className="sg2" role="group" aria-label={label}>
      {items.map((t) =>
        hrefFor ? (
          <Link key={t.key} href={hrefFor(t.key)} scroll={false} className={"sg" + (t.key === value ? " on" : "")} aria-current={t.key === value ? "true" : undefined}>
            {t.label}
          </Link>
        ) : (
          <button key={t.key} type="button" className={"sg" + (t.key === value ? " on" : "")} aria-pressed={t.key === value} onClick={() => onChange?.(t.key)}>
            {t.label}
          </button>
        )
      )}
    </div>
  );
}

/* ── Status chips (.chipst) ── */
export function Chip({ bg, fg, children, style }: { bg: string; fg: string; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <span className="chipst" style={{ background: bg, color: fg, ...style }}>
      {children}
    </span>
  );
}

export function OrderChip({ status, label }: { status: OrderStatus; label?: string }) {
  const [bg, fg] = ORDER_CHIP[status];
  return (
    <Chip bg={bg} fg={fg}>
      {label ?? ORDER_LABEL[status]}
    </Chip>
  );
}

export function ArtworkChip({ status }: { status: ArtworkStatus }) {
  const s = ARTWORK_STATUS[status];
  return (
    <Chip bg={s.chip[0]} fg={s.chip[1]}>
      {s.label}
    </Chip>
  );
}

/* ── Round header button (.hbtn) with an optional badge ── */
export function HeaderButton({
  label,
  icon,
  onClick,
  href,
  badge,
  badgeTone = "red",
  dark,
  stroke = 1.8,
}: {
  label: string;
  icon: IconName;
  onClick?: () => void;
  href?: string;
  badge?: number;
  badgeTone?: "red" | "ember";
  dark?: boolean;
  stroke?: number;
}) {
  const cls = "hbtn" + (dark ? " dark" : "");
  const inner = (
    <>
      <Icon name={icon} size={20} stroke={stroke} />
      {!!badge && badge > 0 && (
        <span className={"bdg" + (badgeTone === "ember" ? " y" : "")} aria-hidden="true">
          {badge}
        </span>
      )}
    </>
  );
  const name = badge ? `${label} (${badge})` : label;
  return href ? (
    <Link href={href} className={cls} aria-label={name}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={cls} aria-label={name} onClick={onClick}>
      {inner}
    </button>
  );
}

/* ── Primary CTA (.cta): shrinks into a spinner while loading ── */
export function Cta({
  children,
  onClick,
  href,
  loading,
  disabled,
  tone = "ink",
  arrow,
  type = "button",
  style,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  loading?: boolean;
  disabled?: boolean;
  tone?: "ink" | "ember" | "danger";
  arrow?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
  className?: string;
}) {
  const cls = ["cta", tone === "ember" && "ember", tone === "danger" && "danger", loading && "loading", className].filter(Boolean).join(" ");
  const label = (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {children}
      {arrow && <Icon name="arrowRight" size={18} stroke={2} className="arw" />}
    </span>
  );
  if (href && !loading) {
    return (
      <Link href={href} className={cls} style={style}>
        {label}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled || loading} aria-busy={loading || undefined} style={style}>
      {loading ? (
        <>
          <SpinArc />
          <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Working…</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}

/* ── − n + stepper (.qty) ── */
export function Stepper({
  value,
  min = 1,
  max = 10,
  onChange,
  label,
  unit,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  label: string;
  unit?: (n: number) => string;
}) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" className="qbtn" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
        <Icon name="minus" size={18} stroke={2.2} />
      </button>
      <span className="qv" aria-live="polite">
        {unit ? unit(value) : value}
      </span>
      <button type="button" className="qbtn" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        <Icon name="plus" size={18} stroke={2.2} />
      </button>
    </div>
  );
}
