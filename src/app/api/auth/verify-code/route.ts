import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { hashCode } from "@/lib/verification-code";

const schema = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) });

// Checks the 6-digit code from the signup email and marks the account verified.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
  }
  const { email, code } = parsed.data;

  // Only 6 digits, so guessing has to be slowed down hard.
  const { allowed } = rateLimit(`verify:${clientIp(req)}:${email.toLowerCase()}`, 8, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a while and try again." }, { status: 429 });
  }

  const token = hashCode(email, code);
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "That code is wrong or has expired. Request a new one." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
  ]);

  return NextResponse.json({ ok: true });
}
