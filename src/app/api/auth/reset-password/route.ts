import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clearResetTokens, linkGuestOrders, resetTokenEmail } from "@/lib/account-tokens";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Same password rule as signup.
const schema = z.object({ token: z.string().min(1).max(200), password: z.string().min(8).max(72) });

// Step 2 of a password reset: the link from the email sets a new password.
// The link is single use. Opening it also proves the person owns the email,
// so an unverified account becomes verified and any guest orders placed with
// that email are attached to it. Every existing session is signed out.
export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(`reset:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a while before trying again." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a password of at least 8 characters." }, { status: 400 });
  }

  const email = await resetTokenEmail(parsed.data.token);
  if (!email) {
    return NextResponse.json({ error: "This reset link is invalid or has expired. Ask for a new one." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await clearResetTokens(email);
    return NextResponse.json({ error: "This reset link is invalid or has expired. Ask for a new one." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: user.id },
    // sessionVersion +1 signs out every device that was signed in before.
    data: { passwordHash, emailVerified: user.emailVerified ?? new Date(), sessionVersion: { increment: 1 } },
  });
  await clearResetTokens(email);
  await linkGuestOrders(user.id, email);

  return NextResponse.json({ ok: true });
}
