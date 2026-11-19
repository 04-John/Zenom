"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useLenis } from "@/components/motion/LenisProvider";
import { MEDIUMS, type Medium } from "@/lib/commission";
import {
  CATEGORY_LABEL,
  DELIVERY_KADUNA,
  MAX_SUBJECTS,
  PRICE_PER_ADDITIONAL_SUBJECT,
  SIZES,
  artworkPrice,
  formatNaira,
  framingPrice,
  startingPrice,
  unitPriceFor,
  type Category,
} from "@/lib/pricing";
import { useStudioInfo } from "@/components/StudioInfoProvider";
import { uploadImage } from "@/lib/upload-image";
import { Cta, Icon, SpinArc, Stepper, useLightToast, useSavedFlash, useShake } from "@/components/mobile/ui";
import { ROOM_KEYS, displayPhoto } from "../model";
import type { RoomInfo } from "../server";
import { prettyDate, todayYmd } from "../format";
import { useReducedMotion } from "../hooks";
import { CommissionWelcome } from "./CommissionWelcome";
import { CommissionDone, type CommissionResult } from "./CommissionDone";

export type CommissionPrefill = { name: string; email: string; phone: string; address: string; room?: Category; size?: number };

type Form = {
  room: Category;
  medium: Medium;
  photoUrl: string;
  photoName: string;
  size: number;
  framed: boolean;
  people: number;
  delivery: "kaduna" | "other";
  date: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};
type Screen = "intro" | "form" | "done";

const STEP_NAMES = ["Artwork", "Size & delivery", "Your details", "Review"];
// The in-progress request survives a refresh (that is what the "Saved" tick means).
const STORE_KEY = "zs.commission.v1";
const MAX_PHOTO = 10 * 1024 * 1024;

const initialForm = (p: CommissionPrefill): Form => ({
  room: p.room ?? "portrait",
  medium: "Charcoal",
  photoUrl: "",
  photoName: "",
  size: p.size ?? 2,
  framed: true,
  people: 1,
  delivery: "kaduna",
  date: "",
  name: p.name,
  phone: p.phone,
  email: p.email,
  address: p.address,
  notes: "",
});

/** Accept only well-formed values back from sessionStorage. */
function sanitize(raw: unknown): Partial<Form> {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<Form> = {};
  if (ROOM_KEYS.includes(r.room as Category)) out.room = r.room as Category;
  if ((MEDIUMS as readonly string[]).includes(r.medium as string)) out.medium = r.medium as Medium;
  if (typeof r.photoUrl === "string" && /^https:\/\/res\.cloudinary\.com\/\S+$/.test(r.photoUrl)) {
    out.photoUrl = r.photoUrl;
    out.photoName = typeof r.photoName === "string" ? r.photoName.slice(0, 60) : "";
  }
  if (Number.isInteger(r.size) && (r.size as number) >= 0 && (r.size as number) < SIZES.length) out.size = r.size as number;
  if (typeof r.framed === "boolean") out.framed = r.framed;
  if (Number.isInteger(r.people) && (r.people as number) >= 1 && (r.people as number) <= MAX_SUBJECTS) out.people = r.people as number;
  if (r.delivery === "kaduna" || r.delivery === "other") out.delivery = r.delivery;
  if (typeof r.date === "string" && (r.date === "" || /^\d{4}-\d{2}-\d{2}$/.test(r.date))) out.date = r.date;
  for (const k of ["name", "phone", "email", "address", "notes"] as const) if (typeof r[k] === "string") out[k] = (r[k] as string).slice(0, k === "notes" ? 1000 : 500);
  return out;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The light app's commission request (Flow-Mobile.dc.html): welcome, four
 * steps (Artwork · Size & delivery · Your details · Review), then Request
 * received. Submits to POST /api/orders as { kind: "commission" }; the
 * server prices it and saves it as a PENDING order.
 */
export function CommissionFlow({ rooms, prefill, start, signedIn }: { rooms: RoomInfo[]; prefill: CommissionPrefill; start: boolean; signedIn: boolean }) {
  const { say } = useLightToast();
  const { lenis } = useLenis();
  const reduced = useReducedMotion();
  const { quoteTurnaround } = useStudioInfo();

  const [screen, setScreen] = useState<Screen>(start ? "form" : "intro");
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [f, setForm] = useState<Form>(() => initialForm(prefill));
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CommissionResult | null>(null);
  const [minDate, setMinDate] = useState<string>();
  const [saved, flashSaved] = useSavedFlash();

  const nameShake = useShake();
  const phoneShake = useShake();
  const emailShake = useShake();
  const [msg, setMsg] = useState({ name: "", phone: "", email: "" });
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Restore an in-progress request from this tab's session (after first paint,
  // so server and client render the same HTML).
  useEffect(() => {
    setMinDate(todayYmd());
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as { f?: unknown; step?: unknown; screen?: unknown };
        const fromQuery = prefill.room !== undefined || prefill.size !== undefined;
        setForm((cur) => {
          const merged: Form = { ...cur, ...sanitize(stored.f) };
          for (const k of ["name", "phone", "email", "address"] as const) if (!merged[k] && cur[k]) merged[k] = cur[k];
          if (prefill.room) merged.room = prefill.room;
          if (prefill.size !== undefined) merged.size = prefill.size;
          return merged;
        });
        if (stored.screen === "form" && !fromQuery) {
          setScreen("form");
          const s = Number(stored.step);
          setStep(Number.isInteger(s) && s >= 1 && s <= 4 ? s : 1);
        }
      }
    } catch {
      /* storage unavailable: start fresh */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (screen === "done") sessionStorage.removeItem(STORE_KEY);
      else sessionStorage.setItem(STORE_KEY, JSON.stringify({ f, step, screen }));
    } catch {
      /* ignore */
    }
  }, [f, step, screen, hydrated]);

  const toTop = () => {
    lenis.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
  };

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((cur) => ({ ...cur, [k]: v }));
    flashSaved();
    if (k === "name") nameShake.clear();
    if (k === "phone") phoneShake.clear();
    if (k === "email") emailShake.clear();
  };

  const go = (n: number) => {
    setDir(n >= step ? "fwd" : "back");
    setStep(n);
    toTop();
  };

  const startForm = () => {
    setScreen("form");
    setDir("fwd");
    setStep(1);
    toTop();
  };

  const back = () => {
    if (step === 1) {
      setScreen("intro");
      toTop();
    } else go(step - 1);
  };

  /** Name + WhatsApp required (as the API: name ≥ 2, phone 7–20); email optional but must look right. */
  const validate = (focus = true): boolean => {
    const name = f.name.trim();
    const phone = f.phone.trim();
    const email = f.email.trim();
    const nameBad = name.length < 2;
    const phoneBad = phone.replace(/\D/g, "").length < 7 || phone.length > 20;
    const emailBad = !!email && !EMAIL_RE.test(email);
    setMsg({
      name: name ? "Add your full name so Samuel knows who it's for." : "Add your name so Samuel knows who it's for.",
      phone: phone ? "Check the number: at least 7 digits, with the country code if you're outside Nigeria." : "We need a WhatsApp number to confirm your order.",
      email: "Check the email address, or leave it empty.",
    });
    if (nameBad) nameShake.shake();
    else nameShake.clear();
    if (phoneBad) phoneShake.shake();
    else phoneShake.clear();
    if (emailBad) emailShake.shake();
    else emailShake.clear();
    const first = nameBad ? nameRef : phoneBad ? phoneRef : emailBad ? emailRef : null;
    if (focus) first?.current?.focus();
    return !first;
  };

  const submit = async () => {
    if (uploading) {
      say("Your photo is still uploading…");
      return;
    }
    if (!validate(false)) {
      go(3);
      window.setTimeout(() => validate(true), 80);
      return;
    }
    setLoading(true);
    try {
      const body = {
        kind: "commission",
        category: f.room,
        medium: f.medium,
        sizeIndex: f.size,
        framed: f.framed,
        subjectCount: f.room === "portrait" ? f.people : 1,
        delivery: f.delivery,
        neededBy: f.date || undefined,
        photoUrl: f.photoUrl || undefined,
        customerName: f.name.trim(),
        customerPhone: f.phone.trim(),
        customerEmail: f.email.trim(),
        deliveryAddress: f.address.trim() || undefined,
        notes: f.notes.trim() || undefined,
      };
      const [res] = await Promise.all([
        fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
        wait(reduced ? 0 : 900),
      ]);
      const data = (await res.json().catch(() => ({}))) as Partial<CommissionResult> & { error?: string };
      if (!res.ok || !data.id || !data.orderNumber) throw new Error(data.error || "Something went wrong. Please try again.");
      setResult({ id: data.id, orderNumber: data.orderNumber, whatsappUrl: data.whatsappUrl ?? "", total: data.total ?? 0, deposit: data.deposit ?? 0 });
      setScreen("done");
      toTop();
    } catch (err) {
      const offline = err instanceof TypeError;
      say(offline ? "Couldn't reach the studio. Check your connection and try again." : (err as Error).message, { tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (loading) return;
    if (step === 3 && !validate()) return;
    if (step < 4) go(step + 1);
    else void submit();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const okType = /^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
    if (!okType) {
      say("Choose a JPG, PNG or HEIC photo", { tone: "error" });
      return;
    }
    if (file.size > MAX_PHOTO) {
      say("That photo is over 10 MB. Try a smaller one, or send it on WhatsApp.", { tone: "error" });
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, "commission");
      setForm((cur) => ({ ...cur, photoUrl: url, photoName: file.name.slice(0, 60) }));
      flashSaved();
      say("Photo added");
    } catch (err) {
      say((err as Error).message || "Upload failed. You can send the photo on WhatsApp instead.", { tone: "error" });
    } finally {
      setUploading(false);
    }
  };

  const newRequest = () => {
    setForm((cur) => ({ ...initialForm(prefill), name: cur.name, phone: cur.phone, email: cur.email, address: cur.address }));
    setResult(null);
    startForm();
  };

  const totalWorks = rooms.reduce((n, r) => n + r.count, 0);

  if (screen === "intro") return <CommissionWelcome totalWorks={totalWorks} onStart={startForm} />;
  if (screen === "done" && result)
    return <CommissionDone result={result} phone={f.phone.trim()} framed={f.framed} signedIn={signedIn} email={f.email.trim()} onNew={newRequest} />;

  const room = rooms.find((r) => r.key === f.room) ?? rooms[0];
  const isP = f.room === "portrait";
  const label = CATEGORY_LABEL[f.room];
  const estimate = unitPriceFor({ category: f.room, sizeIndex: f.size, framed: f.framed, subjectCount: isP ? f.people : 1 }) + (f.delivery === "kaduna" ? DELIVERY_KADUNA : 0);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
      aria-label="Commission request"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#ffffff" }}
    >
      <header className="hdr top-0 min-[900px]:top-[84px]" style={{ position: "sticky", zIndex: 20, padding: "calc(var(--m-top) + 8px) 20px 12px", display: "flex", flexDirection: "column", gap: 14, background: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button type="button" className="icon" aria-label={step === 1 ? "Back to welcome" : `Back to ${STEP_NAMES[step - 2]}`} onClick={back}>
            <Icon name="back" size={20} stroke={2} />
          </button>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span className="kick" style={{ color: "#9A4A1F" }}>
              Step {step} of 4
            </span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{STEP_NAMES[step - 1]}</span>
          </span>
          <span style={{ width: 44, display: "flex", justifyContent: "flex-end" }}>
            <span className={"saved" + (saved ? " on" : "")} aria-hidden="true">
              <Icon name="check" size={12} stroke={3} style={{ color: "#9A4A1F" }} />
              Saved
            </span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Commission progress"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={step}
          aria-valuetext={`Step ${step} of 4: ${STEP_NAMES[step - 1]}`}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}
        >
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="seg">
              <span className="segfill" style={{ width: i <= step ? "100%" : "0%" }} />
            </span>
          ))}
        </div>
      </header>

      <div style={{ flex: 1, padding: "12px 20px 24px", overflow: "hidden" }}>
        <div key={step} className={dir === "fwd" ? "enter-fwd" : "enter-back"}>
          <div className="panel stagger">
            {step === 1 && (
              <>
                <h1 className="h1">What would you like drawn?</h1>
                <Choices legend="Room">
                  {rooms.map((r) => (
                    <ChoiceChip key={r.key} on={f.room === r.key} onClick={() => setF("room", r.key)}>
                      {r.label}
                    </ChoiceChip>
                  ))}
                </Choices>
                {room && (
                  <div
                    key={room.key}
                    className="pcard"
                    aria-live="polite"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 18, border: "1px solid #E8E2D8", boxShadow: "0 2px 6px rgba(26,23,20,.04)" }}
                  >
                    <span style={{ display: "flex", flex: "none" }} aria-hidden="true">
                      {room.thumbs.map((t, i) => (
                        <Image
                          key={t + i}
                          src={t}
                          alt=""
                          width={68}
                          height={84}
                          sizes="34px"
                          style={{ width: 34, height: 42, objectFit: "cover", borderRadius: 8, border: "2px solid #ffffff", marginLeft: i ? -10 : 0, boxShadow: "0 2px 6px rgba(0,0,0,.12)" }}
                        />
                      ))}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#4A433B" }}>
                        {room.label} · {room.count} works to start from
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>
                        from {formatNaira(startingPrice(f.room))} <span style={{ fontSize: 13, fontWeight: 500, color: "#4A433B" }}>· {SIZES[0].label} in</span>
                      </span>
                    </span>
                  </div>
                )}
                <Choices legend="Medium">
                  {MEDIUMS.map((m) => (
                    <ChoiceChip key={m} on={f.medium === m} onClick={() => setF("medium", m)}>
                      {m}
                    </ChoiceChip>
                  ))}
                </Choices>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span className="lbl" id="photo-label">
                    {isP ? "Your photo" : "A reference (optional)"}
                  </span>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} aria-labelledby="photo-label" />
                  {f.photoUrl ? (
                    <div className="drop has" style={{ cursor: "default" }}>
                      <Image
                        src={displayPhoto(f.photoUrl)}
                        alt="Your photo"
                        width={96}
                        height={120}
                        sizes="48px"
                        style={{ width: 48, height: 60, objectFit: "cover", borderRadius: 10, flex: "none", animation: "m-pop .45s var(--spring) both" }}
                      />
                      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.photoName || "Photo"} added</span>
                        <span style={{ fontSize: 13, color: "#4A433B" }}>You can send more on WhatsApp</span>
                      </span>
                      <button
                        type="button"
                        className="lnk"
                        aria-label="Remove photo"
                        onClick={() => {
                          setForm((cur) => ({ ...cur, photoUrl: "", photoName: "" }));
                          flashSaved();
                        }}
                        style={{ minHeight: 44 }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="drop"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      aria-busy={uploading || undefined}
                      aria-describedby="photo-help"
                    >
                      <span style={{ width: 48, height: 48, flex: "none", borderRadius: 14, background: "#ffffff", border: "1px solid #E8E2D8", display: "flex", alignItems: "center", justifyContent: "center", color: "#9A4A1F" }}>
                        {uploading ? <SpinArc size={22} color="#9A4A1F" /> : <Icon name="image" size={22} stroke={2} />}
                      </span>
                      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }} aria-live="polite">
                          {uploading ? "Uploading your photo…" : isP ? "Add the photo to draw" : "Add a colour or room photo"}
                        </span>
                        <span id="photo-help" style={{ fontSize: 13, color: "#4A433B" }}>
                          JPG or PNG, a clear, well-lit shot works best. Optional: you can send it on WhatsApp instead.
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="h1">How big, and where to?</h1>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 6px 4px 14px", borderRadius: 14, background: "#F6F2EB" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {label} · {f.medium}
                  </span>
                  <button type="button" className="lnk" onClick={() => go(1)} aria-label="Edit artwork" style={{ padding: "4px 8px", minHeight: 44 }}>
                    Edit
                  </button>
                </div>
                <Choices legend="Size (inches)" grid>
                  {SIZES.map((s, i) => (
                    <ChoiceChip
                      key={s.label}
                      on={f.size === i}
                      noTick
                      onClick={() => setF("size", i)}
                      style={{ height: 60, borderRadius: 16, flexDirection: "column", justifyContent: "center", gap: 0, padding: 0 }}
                    >
                      {s.label}
                      <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7 }}>{formatNaira(artworkPrice(f.room, i))}</span>
                    </ChoiceChip>
                  ))}
                </Choices>
                <Choices legend="Framing">
                  <ChoiceChip on={f.framed} onClick={() => setF("framed", true)}>
                    Framed +{formatNaira(framingPrice(f.size, true))}
                  </ChoiceChip>
                  <ChoiceChip on={!f.framed} onClick={() => setF("framed", false)}>
                    Paper only
                  </ChoiceChip>
                </Choices>
                {isP && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <span className="lbl">People in the portrait</span>
                    <Stepper value={f.people} min={1} max={MAX_SUBJECTS} label="People" onChange={(n) => setF("people", n)} />
                    <span style={{ fontSize: 12, color: "#4A433B" }}>+{formatNaira(PRICE_PER_ADDITIONAL_SUBJECT)} for each extra person.</span>
                  </div>
                )}
                <Choices legend="Delivery" note={f.delivery === "kaduna" ? `${formatNaira(DELIVERY_KADUNA)}, delivered to your door.` : "Quoted on WhatsApp with your order."}>
                  <ChoiceChip on={f.delivery === "kaduna"} onClick={() => setF("delivery", "kaduna")}>
                    Kaduna
                  </ChoiceChip>
                  <ChoiceChip on={f.delivery === "other"} onClick={() => setF("delivery", "other")}>
                    Outside Kaduna
                  </ChoiceChip>
                </Choices>
                <label className="lbl" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span>
                    Needed by <span style={{ fontWeight: 400, color: "#4A433B" }}>· optional</span>
                  </span>
                  <input className="field" type="date" value={f.date} min={minDate} onChange={(e) => setF("date", e.target.value)} />
                </label>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="h1">Where do we send it?</h1>
                <p className="sub" style={{ marginTop: -8 }}>
                  Samuel confirms every detail with you on WhatsApp.
                </p>
                <TextField
                  label="Full name"
                  inputRef={nameRef}
                  shake={nameShake}
                  error={msg.name}
                  id="cf-name"
                  input={{ type: "text", autoComplete: "name", placeholder: "Your name", maxLength: 120, value: f.name, onChange: (e) => setF("name", e.target.value), required: true }}
                />
                <TextField
                  label="WhatsApp number"
                  inputRef={phoneRef}
                  shake={phoneShake}
                  error={msg.phone}
                  id="cf-phone"
                  input={{ type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "+234", maxLength: 20, value: f.phone, onChange: (e) => setF("phone", e.target.value), required: true }}
                />
                <TextField
                  label="Email"
                  optional
                  inputRef={emailRef}
                  shake={emailShake}
                  error={msg.email}
                  id="cf-email"
                  input={{ type: "email", inputMode: "email", autoComplete: "email", placeholder: "you@example.com", maxLength: 200, value: f.email, onChange: (e) => setF("email", e.target.value) }}
                />
                <label className="lbl" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  Delivery address
                  <input className="field" type="text" autoComplete="street-address" placeholder="Street, area, city" maxLength={500} value={f.address} onChange={(e) => setF("address", e.target.value)} />
                </label>
                <label className="lbl" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <span>
                    Anything Samuel should know? <span style={{ fontWeight: 400, color: "#4A433B" }}>· optional</span>
                  </span>
                  <textarea
                    className="field"
                    rows={3}
                    maxLength={1000}
                    placeholder="Who's in the photo, colours, where it will hang…"
                    value={f.notes}
                    onChange={(e) => setF("notes", e.target.value)}
                  />
                </label>
              </>
            )}

            {step === 4 && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <h1 className="h1">Review &amp; submit</h1>
                  <p className="sub">Tap Edit to change anything.</p>
                </div>
                <ReviewRows
                  onEdit={go}
                  rows={[
                    ["Artwork", `${label} · ${f.medium}`, 1],
                    ["Photo", f.photoUrl ? f.photoName || "Photo added" : "Sending on WhatsApp", 1],
                    ["Size", `${SIZES[f.size].label} in · ${f.framed ? "Framed" : "Paper only"}${isP ? ` · ${f.people} ${f.people > 1 ? "people" : "person"}` : ""}`, 2],
                    ["Delivery", `${f.delivery === "kaduna" ? "Kaduna" : "Outside Kaduna"} · ${f.date ? `by ${prettyDate(f.date)}` : "any time"}`, 2],
                    ["Contact", [f.name.trim(), f.phone.trim(), f.email.trim()].filter(Boolean).join(" · "), 3],
                    ...(f.address.trim() ? ([["Address", f.address.trim(), 3]] as [string, string, number][]) : []),
                    ...(f.notes.trim() ? ([["Notes", f.notes.trim(), 3]] as [string, string, number][]) : []),
                  ]}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 14, color: "#4A433B" }}>{f.delivery === "kaduna" ? "Estimated total, delivered" : "Estimated total"}</span>
                    <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, whiteSpace: "nowrap" }}>
                      {formatNaira(estimate)}
                      {f.delivery === "kaduna" ? "" : " +"}
                    </span>
                  </div>
                  {f.delivery === "other" && <span style={{ fontSize: 12, color: "#4A433B" }}>Plus delivery outside Kaduna, quoted on WhatsApp.</span>}
                </div>
                <div style={{ display: "flex", gap: 10, padding: 14, borderRadius: 16, background: "#FBEBDD", color: "#4A2410", fontSize: 14, lineHeight: 1.5 }}>
                  <Icon d={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 8v5", "M12 16h.01"]} size={18} stroke={2} style={{ color: "#9A4A1F", flex: "none", marginTop: 2 }} />
                  <span>
                    Samuel confirms the final price on WhatsApp <strong>{quoteTurnaround}</strong>. A 50% non-refundable deposit starts the work. Nothing is charged until you accept.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="ftr" style={{ position: "sticky", bottom: 0, zIndex: 20, padding: "12px 20px calc(16px + var(--m-bottom))", background: "#ffffff", borderTop: "1px solid #EFEAE2" }}>
        <Cta type="submit" loading={loading} arrow>
          {step === 4 ? "Submit request" : "Continue"}
        </Cta>
      </div>
    </form>
  );
}

/* ── Pieces ── */

function Choices({ legend, children, grid, note }: { legend: string; children: ReactNode; grid?: boolean; note?: string }) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      <legend className="lbl" style={{ padding: 0, marginBottom: 10 }}>
        {legend}
      </legend>
      <div style={grid ? { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 } : { display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
      {note && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#4A433B" }} aria-live="polite">
          {note}
        </p>
      )}
    </fieldset>
  );
}

function ChoiceChip({ on, onClick, children, style, noTick }: { on: boolean; onClick: () => void; children: ReactNode; style?: CSSProperties; noTick?: boolean }) {
  return (
    <button type="button" className={"chip" + (on ? " on" : "")} aria-pressed={on} onClick={onClick} style={style}>
      {on && !noTick && <Icon name="check" size={15} stroke={3} />}
      {children}
    </button>
  );
}

function TextField({
  label,
  optional,
  id,
  inputRef,
  shake,
  error,
  input,
}: {
  label: string;
  optional?: boolean;
  id: string;
  inputRef: React.RefObject<HTMLInputElement>;
  shake: { cls: string; error: boolean };
  error: string;
  input: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const errId = `${id}-err`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label className="lbl" htmlFor={id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {label}
        {optional && <span style={{ fontWeight: 400, color: "#4A433B" }}>Optional</span>}
      </label>
      <input
        {...input}
        id={id}
        ref={inputRef}
        className={"field " + shake.cls}
        aria-invalid={shake.error || undefined}
        aria-describedby={shake.error ? errId : undefined}
      />
      {shake.error && (
        <span id={errId} className="errmsg" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

function ReviewRows({ rows, onEdit }: { rows: [string, string, number][]; onEdit: (step: number) => void }) {
  return (
    <div style={{ border: "1px solid #E8E2D8", borderRadius: 18, padding: "2px 16px" }}>
      {rows.map(([k, v, s], i) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < rows.length - 1 ? "1px solid #EFEAE2" : 0 }}>
          <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 12, color: "#4A433B" }}>{k}</span>
            <span style={{ fontSize: 15, fontWeight: 600, overflowWrap: "anywhere" }}>{v}</span>
          </span>
          <button type="button" className="lnk" onClick={() => onEdit(s)} aria-label={`Edit ${k.toLowerCase()}`} style={{ padding: "8px 4px", minHeight: 44 }}>
            Edit
          </button>
        </div>
      ))}
    </div>
  );
}
