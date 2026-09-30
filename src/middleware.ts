import { withAuth } from "next-auth/middleware";

// Server-side route protection — admin UI is never secured by merely
// hiding buttons client-side. /studio requires an authenticated session
// with role ADMIN; /account requires any authenticated session.
export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (req.nextUrl.pathname.startsWith("/studio")) {
        return token?.role === "ADMIN";
      }
      if (req.nextUrl.pathname.startsWith("/account")) {
        return !!token;
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/studio/:path*", "/account/:path*"],
};
