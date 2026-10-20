// Points existing ProductImage rows at the Cloudinary URLs in src/lib/art-cloudinary.json.
// Only rows whose url is a local "/art/<code>.jpg" path (or an older Cloudinary url for the
// same code under zenom-studio/art) are touched. DRY RUN unless you pass --apply.
// Usage: node --env-file=.env scripts/migrate-art-urls.mjs [--apply]
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const apply = process.argv.includes("--apply");
const map = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "lib", "art-cloudinary.json"), "utf8"));
const prisma = new PrismaClient();

const rows = await prisma.productImage.findMany({ select: { id: true, url: true, product: { select: { name: true } } } });
let changes = 0;
for (const r of rows) {
  const code = r.url.match(/(?:^|\/art\/)([wgmf]\d\d)\.jpg$/)?.[1];
  const isLocal = /^\/art\/[wgmf]\d\d\.jpg$/.test(r.url);
  const isOldCloud = /res\.cloudinary\.com\/.+\/zenom-studio\/art\/[wgmf]\d\d\.jpg$/.test(r.url);
  if (!code || !(isLocal || isOldCloud) || !map[code] || map[code] === r.url) continue;
  changes++;
  console.log(`${apply ? "UPDATE" : "would update"} ${code} (${r.product.name}): ${r.url} -> ${map[code]}`);
  if (apply) await prisma.productImage.update({ where: { id: r.id }, data: { url: map[code] } });
}
console.log(`${changes} row(s) ${apply ? "updated" : "would change (dry run — add --apply)"}; ${rows.length} image rows total.`);
await prisma.$disconnect();
