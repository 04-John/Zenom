"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/components/motion/LenisProvider";
import { Icon } from "./Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  /** accessible name of the dialog */
  label: string;
  /** heading row (defaults to `label` in bold) */
  title?: ReactNode;
  /** extra controls left of the close button (e.g. "Mark all read") */
  actions?: ReactNode;
  children: ReactNode;
};

// Bottom sheet from the light app (.mscrim + .modal): slides up 0.45s, scrim
// fades in, 28px top corners. Rendered in a portal (inside a `.m` scope so
// the light styles apply), locks page scroll, closes on Escape or scrim tap,
// moves focus into the sheet and back to the opener on close.
export function Sheet({ open, onClose, label, title, actions, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => setMounted(true), []);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const id = requestAnimationFrame(() => panel.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && panel.current) {
        // keep Tab inside the sheet
        const f = panel.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="m">
      <button type="button" className="mscrim" aria-label="Close" tabIndex={-1} onClick={onClose} />
      {/* data-lenis-prevent: let the wheel scroll a long sheet instead of the (locked) page. */}
      <div ref={panel} className="modal" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} data-lenis-prevent>
        <div className="mhead">
          {title ?? <strong style={{ fontSize: 20 }}>{label}</strong>}
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {actions}
            <button type="button" className="icon" aria-label="Close" onClick={onClose} style={{ width: 44, height: 44 }}>
              <Icon name="close" size={16} stroke={2} />
            </button>
          </span>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
