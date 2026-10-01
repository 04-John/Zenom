import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  // Categories — one per pillar, Abstract/Spaces seeded but gated by
  // the storefront query + feature flag, not by category absence.
  const portraits = await prisma.category.upsert({
    where: { slug: "portraits" },
    update: {},
    create: { pillar: "PORTRAITS", name: "Portraits", slug: "portraits" },
  });
  await prisma.category.upsert({
    where: { slug: "abstract" },
    update: {},
    create: { pillar: "ABSTRACT", name: "Abstract", slug: "abstract" },
  });
  await prisma.category.upsert({
    where: { slug: "spaces" },
    update: {},
    create: { pillar: "SPACES", name: "Spaces", slug: "spaces" },
  });

  // Portrait sizes — 7 sizes, 6x8 through 24x36. Price modifiers are
  // placeholders; replace with Samuel's actual pricing sheet.
  const sizeLabels = ["6x8", "8x10", "11x14", "16x20", "18x24", "20x24", "24x36"];
  for (const [i, label] of sizeLabels.entries()) {
    await prisma.portraitSize.upsert({
      where: { id: `size-${label}` },
      update: {},
      create: { id: `size-${label}`, label, priceModifier: i * 5000 },
    });
  }

  await prisma.backgroundTrack.upsert({
    where: { id: "track-plain" },
    update: {},
    create: { id: "track-plain", label: "Plain", priceModifier: 0 },
  });
  await prisma.backgroundTrack.upsert({
    where: { id: "track-detailed" },
    update: {},
    create: { id: "track-detailed", label: "Detailed", priceModifier: 8000 },
  });

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

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
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

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
