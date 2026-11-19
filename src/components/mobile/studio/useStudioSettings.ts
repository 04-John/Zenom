"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DRAWING_DAYS_RANGE, QUOTE_HOURS_RANGE, drawingTimeText, quoteTurnaroundText } from "@/lib/studio-info";

/** The "Payments & timings" form as text fields (numbers stay strings while typing). */
export type StudioSettingsValues = {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  quoteHours: string;
  drawingDays: string;
};
export type StudioSettingsField = keyof StudioSettingsValues;

type SavedRow = {
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  quoteHours: number;
  drawingDays: number;
};

const fromRow = (r: SavedRow): StudioSettingsValues => ({
  bankName: r.bankName ?? "",
  bankAccountName: r.bankAccountName ?? "",
  bankAccountNumber: r.bankAccountNumber ?? "",
  quoteHours: String(r.quoteHours),
  drawingDays: String(r.drawingDays),
});

const whole = (v: string, min: number, max: number) => {
  if (!/^\d+$/.test(v.trim())) return null;
  const n = Number(v.trim());
  return n >= min && n <= max ? n : null;
};

// Bank details and quote / drawing times for PUT /api/studio/settings,
// shared by the phone (SettingsMobile) and desktop (StudioSettingsForm).
// Checks each field before sending; empty bank fields are saved as "not set".
export function useStudioSettings(initial: StudioSettingsValues) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<StudioSettingsField, string>>>({});

  const keys = Object.keys(values) as StudioSettingsField[];
  const dirty = keys.some((k) => values[k].trim() !== saved[k].trim());
  const bankFilled = [values.bankName, values.bankAccountName, values.bankAccountNumber].filter((v) => v.trim()).length;
  const quoteHours = whole(values.quoteHours, QUOTE_HOURS_RANGE.min, QUOTE_HOURS_RANGE.max);
  const drawingDays = whole(values.drawingDays, DRAWING_DAYS_RANGE.min, DRAWING_DAYS_RANGE.max);
  /** What customers read, e.g. "Quote within 24 hours · ready in about 10 days". */
  const preview =
    quoteHours && drawingDays ? `Quote ${quoteTurnaroundText(quoteHours)} · ready in ${drawingTimeText(drawingDays)} once drawing starts` : null;

  function set(k: StudioSettingsField, v: string) {
    setValues((s) => ({ ...s, [k]: v }));
    setFieldErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  }

  async function save(): Promise<boolean> {
    if (saving) return false;
    const accountNumber = values.bankAccountNumber.replace(/[\s-]/g, "");
    const errs: Partial<Record<StudioSettingsField, string>> = {};
    if (accountNumber && !/^\d{6,20}$/.test(accountNumber)) errs.bankAccountNumber = "Use digits only, 6 to 20 of them.";
    if (!quoteHours) errs.quoteHours = `A whole number from ${QUOTE_HOURS_RANGE.min} to ${QUOTE_HOURS_RANGE.max}.`;
    if (!drawingDays) errs.drawingDays = `A whole number from ${DRAWING_DAYS_RANGE.min} to ${DRAWING_DAYS_RANGE.max}.`;
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError("Check the highlighted fields.");
      return false;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: values.bankName.trim(),
          bankAccountName: values.bankAccountName.trim(),
          bankAccountNumber: accountNumber,
          quoteHours,
          drawingDays,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { settings?: SavedRow; error?: string };
      if (!res.ok || !body.settings) throw new Error(body.error ?? "Couldn't save. Try again.");
      const next = fromRow(body.settings);
      setValues(next);
      setSaved(next);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't save. Try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { values, set, save, saving, dirty, error, fieldErrors, bankFilled, preview };
}
