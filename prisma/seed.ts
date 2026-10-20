import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SIZES, pillarFor, toDbCategory } from "../src/lib/pricing";
import { CATALOG } from "../src/lib/catalog";

const prisma = new PrismaClient();

async function main() {
  // The 6 sizes, straight from pricing.ts (prices are not stored in the DB).
  // ids are stable, so re-running updates in place. Legacy size rows
  // (e.g. 6x8, 8x10) are left alone — old orders may still point at them.
  for (const s of SIZES) {
    const id = `size-${s.label.replace("×", "x")}`;
    const data = { label: s.label, widthIn: s.widthIn, heightIn: s.heightIn, sortOrder: s.sortOrder };
    await prisma.portraitSize.upsert({ where: { id }, update: data, create: { id, ...data } });
  }

  // The 38 artworks from src/lib/catalog.ts (images in /public/art, see
  // scripts/prepare-art.mjs). Matched by archive code, so re-running never
  // overwrites a title or description the owner has already renamed.
  // TODO(owner): titles are placeholders from the design reference.
  let created = 0;
  for (const a of CATALOG) {
    const category = toDbCategory(a.category);
    const pillar = pillarFor(a.category);
    const existing = await prisma.product.findFirst({ where: { archiveCode: a.archiveCode } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: { category, pillar } });
      continue;
    }
    await prisma.product.create({
      data: {
        name: a.title,
        slug: a.slug,
        description: `${a.medium}. ${a.blurb}`,
        category,
        pillar,
        status: "AVAILABLE",
        archiveCode: a.archiveCode,
        images: { create: [{ url: a.src, alt: a.title, order: 0 }] },
      },
    });
    created++;
  }
  console.log(`Artworks: ${created} created, ${CATALOG.length - created} already present. Titles are PLACEHOLDERS — TODO: owner to rename.`);

  // Admin user — no hardcoded default password. Set ADMIN_SEED_EMAIL /
  // ADMIN_SEED_PASSWORD in .env before seeding, or a random one-time
  // password is generated and printed to the console (change it on first
  // login; it is not stored anywhere after this run).
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "zenomart.studio@gmail.com";
  // Nullish coalescing (??) only falls back on null/undefined — an
  // ADMIN_SEED_PASSWORD="" in .env is neither, so it would hash an empty
  // password. Use a truthiness check instead.
  const generatedPassword = crypto.randomBytes(12).toString("base64url");
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || generatedPassword;
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  // An existing admin is never touched, so its password must not be reported.
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log(`Admin ${adminEmail} already exists — left unchanged (use your existing password).`);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Samuel",
        passwordHash,
        role: "ADMIN",
        // Seeded directly, not through /api/auth/signup — mark verified so
        // the emailVerified check in src/lib/auth.ts doesn't lock it out.
        emailVerified: new Date(),
      },
    });
    if (!process.env.ADMIN_SEED_PASSWORD) {
      console.log(`Admin password for ${adminEmail}: ${adminPassword}`);
      console.log("Save this now — it will not be shown again. Change it after first login.");
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
