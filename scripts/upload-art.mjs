// Uploads public/art/*.jpg to Cloudinary (folder zenom-studio/art, public id = code)
// and writes src/lib/art-cloudinary.json (code -> secure_url) which catalog.ts reads.
// Re-runnable: overwrites by public id, so updated artworks (see replace-art.mjs) just work.
// Usage: node --env-file=.env scripts/upload-art.mjs [w09 w07 ...]   (no args = all)
import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Missing CLOUDINARY_* variables. Run with: node --env-file=.env scripts/upload-art.mjs");
  process.exit(1);
}
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const dir = path.join(process.cwd(), "public", "art");
const mapPath = path.join(process.cwd(), "src", "lib", "art-cloudinary.json");
const map = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, "utf8")) : {};

const only = process.argv.slice(2);
const files = fs
  .readdirSync(dir)
  .filter((f) => /^[wgmf]\d\d\.jpg$/.test(f))
  .filter((f) => !only.length || only.includes(f.slice(0, 3)))
  .sort();

for (const f of files) {
  const code = f.slice(0, 3);
  const res = await cloudinary.uploader.upload(path.join(dir, f), {
    folder: "zenom-studio/art",
    public_id: code,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });
  map[code] = res.secure_url;
  console.log(`${code} -> ${res.secure_url} (${res.width}x${res.height}, ${Math.round(res.bytes / 1024)} KB)`);
}
fs.writeFileSync(mapPath, JSON.stringify(Object.fromEntries(Object.entries(map).sort()), null, 2));
console.log(`${files.length} uploaded. Map written to src/lib/art-cloudinary.json`);
