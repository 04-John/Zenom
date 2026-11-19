// Server-only helpers for account self-service: password reset tokens and
// linking guest orders to an account. No schema change: reset tokens reuse
// the VerificationToken table (identifier "reset:<email>", and only a
// SHA-256 hash of the token is stored, so a database leak can't be used to
// reset passwords).
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_PREFIX = "reset:";
export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

/** Issues a new reset token for `email` (any older ones are revoked). Returns the raw token for the email link. */
export async function createResetToken(email: string): Promise<string> {
  const raw = crypto.randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: RESET_PREFIX + email } }),
    prisma.verificationToken.create({
      data: { identifier: RESET_PREFIX + email, token: sha256(raw), expires: new Date(Date.now() + RESET_TTL_MS) },
    }),
  ]);
  return raw;
}

/** The email a still-valid reset token belongs to, or null. Does not consume it. */
export async function resetTokenEmail(raw: string): Promise<string | null> {
  if (!/^[a-f0-9]{64}$/.test(raw)) return null;
  const record = await prisma.verificationToken.findUnique({ where: { token: sha256(raw) } });
  if (!record || !record.identifier.startsWith(RESET_PREFIX) || record.expires < new Date()) return null;
  return record.identifier.slice(RESET_PREFIX.length);
}

/** Revokes every reset token for `email` (after a successful reset). */
export async function clearResetTokens(email: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier: RESET_PREFIX + email } });
}

/**
 * Attaches orders placed while signed out (checkout or commission request) to
 * the account with the same email. Called once the person has proved they own
 * that email: after verifying it, after a password reset, and on each sign-in.
 * Never fails the caller.
 */
export async function linkGuestOrders(userId: string, email: string): Promise<number> {
  try {
    const { count } = await prisma.order.updateMany({
      where: { userId: null, customerEmail: { equals: email.trim(), mode: "insensitive" } },
      data: { userId },
    });
    return count;
  } catch (err) {
    console.error("Linking guest orders failed:", err);
    return 0;
  }
}
