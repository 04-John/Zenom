// Applies the titles in src/lib/catalog.ts to existing products (matched by archive code):
// name, slug and the primary image's alt text. DRY RUN unless you pass --apply.
// Usage: npx ts-node scripts/sync-catalog-names.ts [--apply]
// Safe to re-run. NOTE: this overwrites names — use it only while the catalog is the source of truth.
import { PrismaClient } from "@prisma/client";
import { CATALOG } from "../src/lib/catalog";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

async function main() {
  let changed = 0;
  for (const a of CATALOG) {
    const p = await prisma.product.findFirst({ where: { archiveCode: a.archiveCode }, include: { images: { orderBy: { order: "asc" }, take: 1 } } });
    if (!p) {
      console.log(`${a.archiveCode}: no product found, skipped`);
      continue;
    }
    if (p.name === a.title && p.slug === a.slug) continue;
    changed++;
    console.log(`${apply ? "RENAME" : "would rename"} ${a.archiveCode}: "${p.name}" (${p.slug}) -> "${a.title}" (${a.slug})`);
    if (apply) {
      await prisma.product.update({ where: { id: p.id }, data: { name: a.title, slug: a.slug } });
      if (p.images[0]) await prisma.productImage.update({ where: { id: p.images[0].id }, data: { alt: a.title } });
    }
  }
  console.log(`${changed} product(s) ${apply ? "renamed" : "would change (dry run — add --apply)"}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
