// Regenerates the raster brand assets from the SVGs in public/brand.
// Run: node scripts/make-brand-pngs.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "brand");
const svg = (f) => readFileSync(join(dir, f));

// iOS home-screen icon: ember tile mark, full-bleed (iOS rounds the corners).
await sharp(svg("zenom-badge-ember.svg"), { density: 400 }).resize(180, 180).png().toFile(join(dir, "apple-touch-icon.png"));

// Mark for email headers (light line on the dark header band).
await sharp(svg("zenom-mark-dark.svg"), { density: 400 }).resize(240, 240).png().toFile(join(dir, "zenom-mark-dark.png"));

// 1200x630 share card: ember badge centred on night, with the tagline beneath.
const badge = await sharp(svg("zenom-badge-ember.svg"), { density: 400 }).resize(300, 300).png().toBuffer();
const text = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="130">
    <text x="600" y="62" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="52" fill="#EFE9DF">Zenom Studio — More than a portrait</text>
  </svg>`
);
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#12100E" } })
  .composite([
    { input: badge, left: 450, top: 90 },
    { input: text, left: 0, top: 430 },
  ])
  .png()
  .toFile(join(dir, "og-badge.png"));
console.log("done");
