import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { linkGuestOrders } from "@/lib/account-tokens";

// Clicked from the signup verification email. Marks the user verified
// and consumes the token so it can't be replayed.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const email = req.nextUrl.searchParams.get("email");
  const loginUrl = new URL("/login", req.nextUrl.origin);

  if (!token || !email) {
    loginUrl.searchParams.set("error", "InvalidVerificationLink");
    return NextResponse.redirect(loginUrl);
  }

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!record || record.expires < new Date()) {
    loginUrl.searchParams.set("error", "InvalidVerificationLink");
    return NextResponse.redirect(loginUrl);
  }

  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } }),
  ]);
  // The email is proven now: orders placed with it while signed out join the account.
  await linkGuestOrders(user.id, email);

  loginUrl.searchParams.set("verified", "1");
  return NextResponse.redirect(loginUrl);
}
