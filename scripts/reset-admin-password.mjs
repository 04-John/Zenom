// Resets the password of an existing ADMIN account (there is no "forgot password" flow in the app).
// Usage: node --env-file=.env scripts/reset-admin-password.mjs [email]
//   NEW_ADMIN_PASSWORD=...  use this password (min 10 chars); otherwise a random one is generated and printed once.
// Only touches an existing user with role ADMIN; nothing else is created or changed.
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2] || process.env.ADMIN_SEED_EMAIL || "zenomart.studio@gmail.com";
const provided = process.env.NEW_ADMIN_PASSWORD;
if (provided && provided.length < 10) {
  console.error("NEW_ADMIN_PASSWORD must be at least 10 characters.");
  process.exit(1);
}
const password = provided || crypto.randomBytes(12).toString("base64url");

const prisma = new PrismaClient();
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") {
    console.error(`No ADMIN user with email ${email}. Nothing changed.`);
    process.exit(1);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), emailVerified: user.emailVerified ?? new Date() },
  });
  console.log(`Password reset for ${email}.`);
  if (!provided) console.log(`New password (shown once — change it after you sign in): ${password}`);
} finally {
  await prisma.$disconnect();
}
