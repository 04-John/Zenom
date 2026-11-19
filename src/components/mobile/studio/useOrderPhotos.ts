"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PhotoStage } from "@/lib/order-flags";
import { uploadImage } from "@/lib/upload-image";

export type StudioPhoto = { id: string; stage: PhotoStage; url: string; createdAt: string };

type Result = { ok: true; emailed: boolean } | { ok: false; error: string };

// Progress photos on a studio order, shared by the phone and desktop views:
// the file goes to Cloudinary first (uploadImage "progress"), then
// POST /api/orders/[id]/photos records it; DELETE removes the link.
// The list follows the server after each change (router.refresh), so the
// "changes requested" cue and the customer flags stay in step.
export function useOrderPhotos(orderId: string, initial: StudioPhoto[]) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  /** "upload" while a file is going up, or the id of the photo being removed. */
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A fresh server list (after router.refresh) replaces the local one.
  const serverKey = initial.map((p) => p.id).join(",");
  useEffect(() => {
    setPhotos(initial);
    // serverKey stands in for `initial` (a new array on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  async function add(file: File, stage: PhotoStage): Promise<Result> {
    if (busy) return { ok: false, error: "One moment, still working." };
    if (file.type && !file.type.startsWith("image/")) {
      const msg = "Choose a photo (JPG, PNG or HEIC).";
      setError(msg);
      return { ok: false, error: msg };
    }
    setBusy("upload");
    setError(null);
    try {
      const url = await uploadImage(file, "progress");
      const res = await fetch(`/api/orders/${orderId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, url }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<StudioPhoto> & { emailed?: boolean; error?: string };
      if (!res.ok || !body.id) throw new Error(body.error ?? "Couldn't add the photo. Try again.");
      setPhotos((list) => [...list, { id: body.id!, stage: body.stage ?? stage, url: body.url ?? url, createdAt: body.createdAt ?? new Date().toISOString() }]);
      router.refresh();
      return { ok: true, emailed: !!body.emailed };
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "Couldn't add the photo. Try again.";
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string): Promise<Result> {
    if (busy) return { ok: false, error: "One moment, still working." };
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/photos/${id}`, { method: "DELETE" });
      // 404: already gone (e.g. removed on another device), so drop it here too.
      if (!res.ok && res.status !== 404) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Couldn't remove the photo. Try again.");
      }
      setPhotos((list) => list.filter((p) => p.id !== id));
      router.refresh();
      return { ok: true, emailed: false };
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "Couldn't remove the photo. Try again.";
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setBusy(null);
    }
  }

  return { photos, busy, error, setError, add, remove };
}
