"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BackBar, Cta, Icon, LightPage, SpinArc, SwitchRow, useLightToast, useShake } from "@/components/mobile/ui";
import { ART_GROUPS, slugify } from "@/lib/catalog";
import { CATEGORY_LABEL, formatNaira, fromDbCategory, startingPrice, type DbCategory } from "@/lib/pricing";
import { uploadImage } from "@/lib/upload-image";
import { ARTWORK_STATUS, ARTWORK_STATUSES, type ArtworkStatus } from "@/lib/zenom-mobile";
import { ARTWORKS_BACK_KEY, ART_CATEGORIES, FLASH_KEY, useBackHref } from "./shared";
import { ConfirmSheet } from "./ConfirmSheet";
import { canOptimize } from "./Thumb";

export type ProductFormInitial = {
  id: string;
  name: string;
  description: string;
  category: DbCategory;
  status: ArtworkStatus;
  archiveCode: string | null;
  imageUrl: string | null;
};

const blurbFor = (c: DbCategory) => ART_GROUPS.find((g) => g.category === fromDbCategory(c))?.blurb ?? "Drawn by hand at Zenom Studio.";

/** Same slug rule as the desktop ProductForm; never shorter than the API's 2 characters. */
function makeSlug(title: string) {
  const s = slugify(title).slice(0, 80).replace(/-+$/, "");
  return s.length >= 2 ? s : `artwork-${Date.now().toString(36)}`;
}

// Add / edit artwork in the light studio app (Studio-Mobile.dc.html "showEdit").
// Desktop keeps ProductForm. Saves through the same admin product API:
// POST /api/products (new) or PATCH /api/products/[id] (edit).
export function MobileProductForm({
  initial,
  suggestedCodes,
  defaultCategory = "PORTRAIT",
}: {
  initial?: ProductFormInitial;
  suggestedCodes?: Record<string, string>;
  defaultCategory?: DbCategory;
}) {
  const router = useRouter();
  const { say } = useLightToast();
  const isNew = !initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<DbCategory>(initial?.category ?? defaultCategory);
  const [status, setStatus] = useState<ArtworkStatus>(initial?.status ?? "DRAFT");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const shake = useShake();
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const backHref = useBackHref("/studio/products", ARTWORKS_BACK_KEY, "/studio/products");

  const code = isNew ? suggestedCodes?.[category] ?? "" : initial.archiveCode ?? "";
  const table = category === "PORTRAIT" ? "portrait" : "abstract";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setPhotoErr(null);
    try {
      setImageUrl(await uploadImage(file, "artwork"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Image upload failed.";
      setPhotoErr(msg);
      say(msg, { tone: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (saving || uploading) return;
    const title = name.trim();
    if (title.length < 2) {
      setNameErr(title ? "Use at least 2 characters." : "Give the piece a title.");
      shake.shake();
      titleRef.current?.focus();
      return;
    }
    setSaving(true);
    setError(null);
    const desc = description.trim() || blurbFor(category);
    const json = (method: string, url: string, body: unknown) =>
      fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    try {
      let res: Response;
      if (isNew) {
        const body = { name: title, slug: makeSlug(title), description: desc, category, status, archiveCode: code || undefined, imageUrl: imageUrl || undefined };
        res = await json("POST", "/api/products", body);
        // Same title as an existing piece: keep the title, make the page address unique.
        if (res.status === 409) {
          const suffix = (code || Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          res = await json("POST", "/api/products", { ...body, slug: `${body.slug}-${suffix}` });
        }
      } else {
        const body: Record<string, unknown> = { name: title, category, status };
        if (description.trim() !== initial.description.trim()) body.description = desc;
        if (imageUrl && imageUrl !== initial.imageUrl) body.imageUrl = imageUrl;
        res = await json("PATCH", `/api/products/${initial.id}`, body);
      }
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Couldn't save this artwork. Try again.");
      }
      const saved = await res.json().catch(() => null);
      try {
        if (saved?.id) sessionStorage.setItem(FLASH_KEY, saved.id);
      } catch {
        /* storage unavailable */
      }
      say(isNew ? `${title} added as ${ARTWORK_STATUS[status].label.toLowerCase()}` : "Changes saved");
      router.push("/studio/products");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't save this artwork. Try again.";
      setError(msg);
      say(msg, { tone: "error" });
      setSaving(false);
    }
  }

  async function archive() {
    if (!initial) return;
    const prev = initial.status;
    const title = name.trim() || initial.name;
    const patch = (s: ArtworkStatus) =>
      fetch(`/api/products/${initial.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    setArchiving(true);
    try {
      const res = await patch("DRAFT");
      if (!res.ok) throw new Error();
      setArchiveOpen(false);
      router.push("/studio/products");
      router.refresh();
      say(`${title} archived`, {
        undo: async () => {
          const r = await patch(prev).catch(() => null);
          router.refresh();
          if (r?.ok) say(`${title} is ${ARTWORK_STATUS[prev].label.toLowerCase()} again`);
          else say(`Couldn't restore ${title}.`, { tone: "error" });
        },
      });
    } catch {
      setArchiving(false);
      say(`Couldn't archive ${title}. Try again.`, { tone: "error" });
    }
  }

  return (
    <LightPage desktop="hide">
      <form onSubmit={save} noValidate style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="enter-fwd" style={{ flex: 1, padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ position: "relative" }}>
            <BackBar href={backHref} label="Artworks" />
            <h1 style={{ position: "absolute", left: "50%", bottom: 12, transform: "translateX(-50%)", margin: 0, fontSize: 16, lineHeight: "20px", fontWeight: 700, whiteSpace: "nowrap", pointerEvents: "none" }}>
              {isNew ? "New artwork" : "Edit artwork"}
            </h1>
          </div>

          {/* Photo drop zone → Cloudinary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              type="button"
              className={"drop" + (imageUrl ? " has" : "")}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label={imageUrl ? "Replace the photo of the piece" : "Upload a photo of the piece"}
              aria-describedby={photoErr ? "pf-photo-err" : undefined}
              style={{ flexDirection: "column", alignItems: "stretch", padding: 10, gap: 10, position: "relative" }}
            >
              {imageUrl ? (
                <span key={imageUrl} className="artin" style={{ position: "relative", display: "block", height: 240, borderRadius: 12, overflow: "hidden", background: "#EFEAE2" }}>
                  {canOptimize(imageUrl) ? (
                    <Image src={imageUrl} alt="" fill sizes="(max-width: 560px) 100vw, 520px" style={{ objectFit: "cover" }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary image URL
                    <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </span>
              ) : (
                <span style={{ height: 200, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#4A433B" }}>
                  <Icon name="image" size={28} style={{ color: "#9A4A1F" }} />
                  <strong style={{ fontSize: 15, color: "#1A1714" }}>Upload a photo of the piece</strong>
                  <span style={{ fontSize: 12 }}>JPG or PNG · compressed for the site</span>
                </span>
              )}
              <span style={{ fontSize: 12, color: "#4A433B", textAlign: "center" }}>{uploading ? "Uploading…" : imageUrl ? "Tap to replace the photo" : "Tap to choose a photo"}</span>
              {uploading && (
                <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: 16, background: "rgba(250,247,242,.72)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: 52, height: 52, borderRadius: "50%", background: "#9A4A1F", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SpinArc />
                  </span>
                </span>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden aria-hidden="true" tabIndex={-1} />
            {photoErr && (
              <span id="pf-photo-err" className="errmsg" role="alert">
                {photoErr}
              </span>
            )}
          </div>

          <label className="lbl" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            Title
            <input
              ref={titleRef}
              className={"field " + shake.cls}
              type="text"
              placeholder="e.g. Held Gaze"
              value={name}
              required
              maxLength={200}
              aria-invalid={!!nameErr}
              aria-describedby={nameErr ? "pf-name-err" : undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (nameErr) {
                  setNameErr(null);
                  shake.clear();
                }
              }}
            />
            {nameErr && (
              <span id="pf-name-err" className="errmsg" role="alert">
                {nameErr}
              </span>
            )}
          </label>

          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="lbl" style={{ padding: 0, marginBottom: 10 }}>
              Category
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ART_CATEGORIES.map((c) => (
                <button key={c} type="button" className={"chip" + (category === c ? " on" : "")} aria-pressed={category === c} onClick={() => setCategory(c)}>
                  {CATEGORY_LABEL[fromDbCategory(c)]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className="lbl" style={{ padding: 0, marginBottom: 10 }}>
              Status
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ARTWORK_STATUSES.map((s) => (
                <button key={s} type="button" className={"chip" + (status === s ? " on" : "")} aria-pressed={status === s} onClick={() => setStatus(s)}>
                  {ARTWORK_STATUS[s].label}
                </button>
              ))}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#4A433B" }}>{ARTWORK_STATUS[status].help}</p>
          </fieldset>

          <label className="lbl" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span>
              Description <span style={{ fontWeight: 400, color: "#4A433B" }}>(optional)</span>
            </span>
            <textarea className="field" rows={3} maxLength={5000} placeholder={blurbFor(category)} value={description} onChange={(e) => setDescription(e.target.value)} />
            <span style={{ fontSize: 12, fontWeight: 400, color: "#4A433B" }}>Left empty, the room&rsquo;s standard line is used.</span>
          </label>

          <div className="gl">
            <div className="swrow">
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 14 }}>Archive code</strong>
                <span style={{ fontSize: 12, color: "#4A433B" }}>{isNew ? "Set from the category" : "Set when it was added"}</span>
              </span>
              <strong style={{ fontSize: 14 }}>{code || "—"}</strong>
            </div>
            <div className="swrow">
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <strong style={{ fontSize: 14 }}>Price</strong>
                <span style={{ fontSize: 12, color: "#4A433B" }}>From the {table} price list</span>
              </span>
              <strong style={{ fontSize: 14 }}>from {formatNaira(startingPrice(fromDbCategory(category)))}</strong>
            </div>
            {/* No "featured" field in the schema yet: shown, but switched off. */}
            <SwitchRow title="Show on home page" body="Coming soon: adds it to the hero slideshow" checked={false} onChange={() => {}} disabled last />
          </div>

          {!isNew && initial.status !== "DRAFT" && (
            <button type="button" className="sec danger" onClick={() => setArchiveOpen(true)}>
              Archive artwork
            </button>
          )}
        </div>

        <div className="ftr" style={{ position: "sticky", bottom: 0, zIndex: 5, padding: "12px 20px calc(16px + env(safe-area-inset-bottom, 0px))", background: "#ffffff", borderTop: "1px solid #EFEAE2" }}>
          {error && (
            <p className="errmsg" role="alert" style={{ margin: "0 0 10px", textAlign: "center" }}>
              {error}
            </p>
          )}
          <Cta type="submit" loading={saving} disabled={uploading}>
            {isNew ? "Add artwork" : "Save changes"}
          </Cta>
        </div>
      </form>

      {!isNew && (
        <ConfirmSheet
          open={archiveOpen}
          onClose={() => setArchiveOpen(false)}
          title={`Archive ${name.trim() || initial.name}?`}
          body="It is hidden from the site and kept here as a draft. Past orders keep their record."
          cta="Archive"
          busy={archiving}
          onConfirm={archive}
        />
      )}
    </LightPage>
  );
}
