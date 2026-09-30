import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const signupSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`signup:${clientIp(req)}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const parsed = signupSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash, role: "CUSTOMER" },
  });

  // Account exists but emailVerified stays null until the link below is
  // clicked — see src/lib/auth.ts authorize(), which refuses to log in
  // unverified accounts.
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: parsed.data.email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail({ email: parsed.data.email, name: parsed.data.name, token });

  return NextResponse.json({ ok: true }, { status: 201 });
}
