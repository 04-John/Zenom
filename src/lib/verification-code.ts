import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Signup verification uses a 6-digit code typed on the site instead of an
// emailed link (links to shared hosting domains get mail filed as spam).
// The code is stored hashed in VerificationToken, keyed to the email, so a
// leaked database row can't be used directly and the same 6 digits can exist
// for different users without hitting the unique constraint on `token`.
export const CODE_TTL_MS = 15 * 60 * 1000;

export const hashCode = (email: string, code: string) =>
  crypto.createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");

/** Replaces any pending code for this email with a fresh one and returns it. */
export async function issueVerificationCode(email: string): Promise<string> {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
    prisma.verificationToken.create({
      data: { identifier: email, token: hashCode(email, code), expires: new Date(Date.now() + CODE_TTL_MS) },
    }),
  ]);
  return code;
}
