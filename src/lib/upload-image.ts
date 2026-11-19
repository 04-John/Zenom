// Browser-side signed upload to Cloudinary (see /api/uploads/signature).
// purpose "artwork" = admin product image; "commission" = a customer's
// reference photo (guests allowed, rate limited). Returns the secure URL.
export async function uploadImage(file: File, purpose: "artwork" | "commission" = "artwork"): Promise<string> {
  const sigRes = await fetch("/api/uploads/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(purpose === "commission" ? { purpose: "commission" } : {}),
  });
  if (!sigRes.ok) {
    const body = await sigRes.json().catch(() => ({}));
    throw new Error(body.error ?? "Couldn't prepare the upload.");
  }
  const { signature, timestamp, apiKey, cloudName, folder, allowedFormats } = await sigRes.json();

  const data = new FormData();
  data.append("file", file);
  data.append("api_key", apiKey);
  data.append("timestamp", String(timestamp));
  data.append("signature", signature);
  data.append("folder", folder);
  if (allowedFormats) data.append("allowed_formats", allowedFormats);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
  if (!res.ok) throw new Error("Image upload failed.");
  const uploaded = await res.json();
  return uploaded.secure_url as string;
}
