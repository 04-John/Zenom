"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useStudioSettings, type StudioSettingsField, type StudioSettingsValues } from "@/components/mobile/studio/useStudioSettings";

// Desktop "Payments & timings" (dark studio). Same checks and API as the
// phone's Studio tab: PUT /api/studio/settings.
export function StudioSettingsForm({ initial }: { initial: StudioSettingsValues }) {
  const { toast } = useToast();
  const f = useStudioSettings(initial);

  const field = (k: StudioSettingsField, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const err = f.fieldErrors[k];
    return (
      <label className="block min-w-0">
        <span className="label-mono">{label}</span>
        <input
          type="text"
          autoComplete="off"
          value={f.values[k]}
          onChange={(e) => f.set(k, e.target.value)}
          disabled={f.saving}
          aria-invalid={!!err}
          aria-describedby={err ? `ds-${k}-err` : undefined}
          className={`field mt-2 disabled:opacity-60 ${err ? "border-ember" : ""}`}
          {...extra}
        />
        {err && (
          <span id={`ds-${k}-err`} role="alert" className="mt-1 block text-xs text-ember">
            {err}
          </span>
        )}
      </label>
    );
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (await f.save()) toast("Payments & timings saved.");
  }

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-4">
      {field("bankName", "Bank name", { maxLength: 80, placeholder: "e.g. GTBank" })}
      {field("bankAccountName", "Account name", { maxLength: 120 })}
      {field("bankAccountNumber", "Account number", { inputMode: "numeric", maxLength: 24 })}
      <p className={`text-xs ${f.bankFilled > 0 && f.bankFilled < 3 ? "text-ember" : "text-ink-3"}`}>
        {f.bankFilled === 3
          ? "Customers see these on their order and in the quote email."
          : "Customers see the bank details on their order and in the quote email once all three are filled."}
      </p>
      <div className="grid gap-4 border-t border-ink/10 pt-4 sm:grid-cols-2">
        {field("quoteHours", "Quote time (hours)", { inputMode: "numeric", maxLength: 3 })}
        {field("drawingDays", "Drawing time (days)", { inputMode: "numeric", maxLength: 3 })}
      </div>
      {f.preview && <p className="text-xs text-ink-3">Customers read: {f.preview}.</p>}
      {f.error && (
        <p role="alert" className="text-sm text-ember">
          {f.error}
        </p>
      )}
      <Button type="submit" loading={f.saving} disabled={!f.dirty}>
        Save changes
      </Button>
    </form>
  );
}
