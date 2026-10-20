// Replaces catalog artworks with updated versions (resized to ~1600px on the long edge).
// Usage: node scripts/replace-art.mjs w09=<path> w07=<path> w10=<path>
// Also refreshes the width/height in src/lib/art-manifest.json.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const manifestPath = path.join(process.cwd(), "src", "lib", "art-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const arg of process.argv.slice(2)) {
  const [code, src] = arg.split("=");
  if (!/^[wgmf]\d\d$/.test(code) || !src) {
    console.error(`Bad argument "${arg}" (expected code=path, e.g. w09=C:\\new\\w09.jpg)`);
    process.exit(1);
  }
  const dest = path.join(process.cwd(), "public", "art", `${code}.jpg`);
  const { width, height, size } = await sharp(src)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dest);
  manifest[code] = { width, height, bytes: size };
  console.log(`${code}: replaced -> ${width}x${height} (${Math.round(size / 1024)} KB)`);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
