"use client";

import { useState } from "react";
import { ZenomSpinner } from "@/components/brand/ZenomSpinner";
import { Thumb } from "@/components/mobile/studio/Thumb";
import { useOrderPhotos, type StudioPhoto } from "@/components/mobile/studio/useOrderPhotos";
import { useToast } from "@/components/ui/Toast";
import { buttonClass } from "@/lib/button-class";
import { PHOTO_STAGES, defaultPhotoStage, sketchHint, type PhotoStage } from "@/lib/order-flags";

// Desktop studio: progress photos on an order. Pick the stage, choose a file
// (uploaded to Cloudinary, then saved on the order), remove with an inline
// confirm. Same API and hook as the phone view (OrderPhotosMobile).
export function ProgressPhotos({
  orderId,
  status,
  first,
  hasAccount,
  photos: initial,
}: {
  orderId: string;
  status: string;
  first: string;
  hasAccount: boolean;
  photos: StudioPhoto[];
}) {
  const { toast } = useToast();
  const { photos, busy, error, add, remove } = useOrderPhotos(orderId, initial);
  const [stage, setStage] = useState<PhotoStage>(() => defaultPhotoStage(status));
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const canEdit = status !== "CANCELLED";
  const uploading = busy === "upload";
  const meta = PHOTO_STAGES.find((s) => s.key === stage)!;
  const hint = stage === "SKETCH" ? sketchHint(status, first, hasAccount) : null;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const label = meta.label; // the stage picked when the file was chosen
    const r = await add(file, stage);
    if (r.ok) toast(r.emailed ? "Sketch shared · customer emailed" : `${label} photo added.`);
    else toast(r.error, "error");
  }

  async function onRemove(id: string) {
    const r = await remove(id);
    setConfirmId(null);
    if (r.ok) toast("Photo removed.");
    else toast(r.error, "error");
  }

  if (!canEdit && photos.length === 0) return null;

  return (
    <section className="mt-8 rounded-card border border-ink/10 bg-night-raised p-6" aria-labelledby="progress-photos">
      <h2 id="progress-photos" className="label-mono">
        Progress photos
      </h2>

      {canEdit && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Stage of the next photo" className="flex flex-wrap gap-2">
            {PHOTO_STAGES.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={stage === s.key}
                disabled={!!busy}
                onClick={() => setStage(s.key)}
                className={`rounded-pill border px-4 py-2 text-xs disabled:opacity-50 ${
                  stage === s.key ? "border-ink bg-ink text-night" : "border-ink/20 text-ink-2 hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label
            className={buttonClass(
              "secondary",
              `focus-within:outline focus-within:outline-2 focus-within:outline-ember ${busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`
            )}
          >
            {uploading ? <ZenomSpinner size={20} /> : `Add ${meta.noun} photo`}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={!!busy} className="sr-only" />
          </label>
        </div>
      )}
      {canEdit && hint && <p className="mt-3 text-xs text-ink-3">{hint}</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-ember">
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="mt-5 text-sm text-ink-3">No photos yet.</p>
      ) : (
        PHOTO_STAGES.map((s) => {
          const list = photos.filter((p) => p.stage === s.key);
          if (!list.length) return null;
          return (
            <div key={s.key} className="mt-6">
              <h3 className="text-sm text-ink">
                {s.label} <span className="text-ink-3">({list.length})</span>
              </h3>
              <ul className="mt-3 flex flex-wrap gap-4">
                {list.map((p, i) => (
                  <li key={p.id} className={`w-28 ${busy === p.id ? "opacity-50" : ""}`}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${s.noun} photo ${i + 1} (opens in a new tab)`} className="block rounded-tile hover:opacity-90">
                      <Thumb src={p.url} w={112} h={140} radius={12} />
                    </a>
                    {canEdit &&
                      (confirmId === p.id ? (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <span className="text-ink-2">Remove?</span>
                          <button type="button" onClick={() => onRemove(p.id)} disabled={!!busy} className="text-ember underline disabled:opacity-50">
                            {busy === p.id ? <ZenomSpinner size={16} /> : "Remove"}
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} disabled={!!busy} className="text-ink-2 underline hover:text-ink disabled:opacity-50">
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(p.id)}
                          disabled={!!busy}
                          className="mt-2 text-xs text-ink-2 underline hover:text-ember disabled:opacity-50"
                        >
                          Remove
                        </button>
                      ))}
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
