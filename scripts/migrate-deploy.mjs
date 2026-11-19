// Applies pending database migrations (prisma/migrations) before the Netlify
// build, so the database and the code that uses it always ship together.
//
// - Production deploys only (Netlify sets CONTEXT). Deploy previews and branch
//   deploys share the production database, so they must never migrate it.
//   Local `npm run build` never migrates either.
// - Neon's pooled connection (host "...-pooler...") can't hold the lock
//   Prisma Migrate needs, so this uses DIRECT_URL if set, otherwise the
//   DATABASE_URL with "-pooler" removed from the host (Neon's direct host).
// - If a migration fails, the build fails and Netlify keeps the previous
//   deploy live.
import { execSync } from "node:child_process";

const context = process.env.CONTEXT;
if (context !== "production") {
  console.log(`[migrate] Skipping database migrations (context: ${context ?? "local"}).`);
  process.exit(0);
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL is not set for this production build, so migrations can't run.");
  process.exit(1);
}

let direct = url;
try {
  const u = new URL(url);
  u.hostname = u.hostname.replace("-pooler.", ".");
  direct = u.toString();
} catch {
  console.error("[migrate] DATABASE_URL is not a valid URL.");
  process.exit(1);
}

console.log("[migrate] Applying pending migrations…");
execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: direct },
});
