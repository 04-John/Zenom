import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { issueVerificationCode } from "@/lib/verification-code";

const schema = z.object({ email: z.string().email() });

// Sends a fresh code to an account that hasn't verified yet. The answer is
// always "ok" so this can't be used to find out which emails have accounts.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const { email } = parsed.data;

  const { allowed } = rateLimit(`resend:${clientIp(req)}:${email.toLowerCase()}`, 3, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Please wait a few minutes before asking for another code." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    const code = await issueVerificationCode(email);
    await sendVerificationEmail({ email, name: user.name ?? "there", code });
  }

  return NextResponse.json({ ok: true });
}
