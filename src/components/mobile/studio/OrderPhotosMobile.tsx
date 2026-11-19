"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Icon, SegTabs, SpinArc, useLightToast } from "@/components/mobile/ui";
import { PHOTO_STAGES, defaultPhotoStage, sketchHint, type PhotoStage } from "@/lib/order-flags";
import { ConfirmSheet } from "./ConfirmSheet";
import { canOptimize } from "./Thumb";
import { useOrderPhotos, type StudioPhoto } from "./useOrderPhotos";

const tile: React.CSSProperties = { position: "relative", aspectRatio: "4 / 5", borderRadius: 12, overflow: "hidden", background: "#EFEAE2" };

// "Progress photos" on a studio order (light app): pick Sketch / Shading /
// Finished, add a photo (the phone offers the camera or the library), and
// remove one after a confirm sheet. Cancelled orders show their photos only.
export function OrderPhotosMobile({
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
  const { say } = useLightToast();
  const { photos, busy, error, add, remove } = useOrderPhotos(orderId, initial);
  const [stage, setStage] = useState<PhotoStage>(() => defaultPhotoStage(status));
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canEdit = status !== "CANCELLED";
  const uploading = busy === "upload";
  const meta = PHOTO_STAGES.find((s) => s.key === stage)!;
  const shown = photos.filter((p) => p.stage === stage);
  const count = (k: PhotoStage) => photos.filter((p) => p.stage === k).length;
  const hint = stage === "SKETCH" ? sketchHint(status, first, hasAccount) : null;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const label = meta.label; // the stage picked when the file was chosen
    const r = await add(file, stage);
    if (r.ok) say(r.emailed ? "Sketch shared · customer emailed" : `${label} photo added`);
    else say(r.error, { tone: "error" });
  }

  async function onRemove() {
    if (!confirmId) return;
    const r = await remove(confirmId);
    setConfirmId(null);
    if (r.ok) say("Photo removed");
    else say(r.error, { tone: "error" });
  }

  if (!canEdit && photos.length === 0) return null;

  return (
    <div className="grp">
      <p className="gh">Progress photos</p>
      <div className="gl" style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <SegTabs
          label="Photo stage"
          value={stage}
          onChange={setStage}
          items={PHOTO_STAGES.map((s) => {
            const n = count(s.key);
            return { key: s.key, label: n ? `${s.label} · ${n}` : s.label };
          })}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          {shown.map((p, i) => (
            <div key={p.id} style={{ ...tile, opacity: busy === p.id ? 0.5 : 1 }}>
              <a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${meta.noun} photo ${i + 1} (opens in a new tab)`} style={{ position: "absolute", inset: 0 }}>
                {canOptimize(p.url) ? (
                  <Image src={p.url} alt="" fill sizes="(max-width: 560px) 31vw, 170px" style={{ objectFit: "cover" }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- photo URL from a host next/image doesn't serve
                  <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
              </a>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setConfirmId(p.id)}
                  disabled={!!busy}
                  aria-label={`Remove ${meta.noun} photo ${i + 1}`}
                  style={{ position: "absolute", top: 0, right: 0, width: 44, height: 44, border: 0, padding: 0, background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(18,16,14,.72)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="close" size={14} stroke={2.4} />
                  </span>
                </button>
              )}
            </div>
          ))}

          {canEdit && (
            <button
              type="button"
              className="drop"
              onClick={() => fileRef.current?.click()}
              disabled={!!busy}
              aria-busy={uploading || undefined}
              style={{ ...tile, background: undefined, flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 6, padding: 8, textAlign: "center", opacity: busy && !uploading ? 0.5 : 1 }}
            >
              {uploading ? (
                <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#9A4A1F", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SpinArc size={18} />
                </span>
              ) : (
                <Icon name="camera" size={22} style={{ color: "#9A4A1F" }} />
              )}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1714" }}>{uploading ? "Uploading…" : `Add ${meta.noun}`}</span>
            </button>
          )}
        </div>
        {canEdit && <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} hidden aria-hidden="true" tabIndex={-1} />}

        {!canEdit && shown.length === 0 && <span style={{ fontSize: 13, color: "#4A433B" }}>No {meta.noun} photos.</span>}
        {canEdit && hint && <span style={{ fontSize: 12, lineHeight: 1.45, color: "#4A433B" }}>{hint}</span>}
        {error && (
          <span className="errmsg" role="alert">
            {error}
          </span>
        )}
      </div>

      <ConfirmSheet
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Remove this photo?"
        body={`${first} won't see it on their order any more.`}
        cta="Remove"
        busy={!!confirmId && busy === confirmId}
        onConfirm={onRemove}
      />
    </div>
  );
}
