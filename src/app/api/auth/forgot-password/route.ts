import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createResetToken } from "@/lib/account-tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().email().max(254) });

// Step 1 of a password reset: email a one-hour link. The reply is the same
// whether or not an account exists, so this can't be used to find out who
// has an account.
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const email = parsed.data.email;

  const byIp = rateLimit(`forgot:ip:${ip}`, 10, 15 * 60 * 1000);
  const byEmail = rateLimit(`forgot:email:${email.toLowerCase()}`, 3, 15 * 60 * 1000);
  if (!byIp.allowed || !byEmail.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a while before trying again." }, { status: 429 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { email: true, name: true },
    });
    if (user) {
      const token = await createResetToken(user.email);
      await sendPasswordResetEmail({ email: user.email, name: user.name, token });
    }
  } catch (err) {
    console.error("Password reset request failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
