import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Single auth system, single login page. Role-based routing happens
// after authentication — there is deliberately no separate /admin-login.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Throttle by IP+email to slow credential stuffing / brute force —
        // the login form surfaces this via the "TooManyAttempts" error.
        const ip = (req.headers?.["x-forwarded-for"] as string | undefined)?.split(",")[0].trim() ?? "unknown";
        const { allowed } = rateLimit(`login:${ip}:${credentials.email}`, 10, 15 * 60 * 1000);
        if (!allowed) throw new Error("TooManyAttempts");

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Signup sends a verification link (see /api/auth/signup and
        // /api/auth/verify-email) — unverified accounts cannot log in.
        if (!user.emailVerified) throw new Error("EmailNotVerified");

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
