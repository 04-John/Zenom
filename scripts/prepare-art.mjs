// Resizes the 38 handoff artworks to ~1600px on the long edge and writes
// them to public/art/. next/image then serves AVIF/WebP at request time.
// Usage: node scripts/prepare-art.mjs "<path to design_handoff_zenom_redesign/assets/art>"
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2];
if (!src) {
  console.error("Usage: node scripts/prepare-art.mjs <source art dir>");
  process.exit(1);
}
const out = path.join(process.cwd(), "public", "art");
fs.mkdirSync(out, { recursive: true });

const files = fs.readdirSync(src).filter((f) => /^[wgmf]\d\d\.jpe?g$/i.test(f)).sort();
const manifest = {};
for (const f of files) {
  const id = f.slice(0, 3).toLowerCase();
  const img = sharp(path.join(src, f)).rotate();
  const meta = await img.metadata();
  const { info } = await img
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(out, `${id}.jpg`), { resolveWithObject: true }).then((info) => ({ info }));
  manifest[id] = { width: info.width, height: info.height, bytes: info.size };
  console.log(`${id}: ${meta.width}x${meta.height} -> ${info.width}x${info.height} (${Math.round(info.size / 1024)} KB)`);
}
fs.writeFileSync(path.join(process.cwd(), "src", "lib", "art-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`${files.length} images written to ${out}`);
