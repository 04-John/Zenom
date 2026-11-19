// Routes that use the light iPhone app layout below 900px (customer app,
// commission flow, studio admin, sign-in). On these routes, under 900px, the
// dark storefront chrome (floating nav, footer, film grain, scroll bar) is
// hidden and the light app draws its own header and tab bar. Desktop is
// unchanged everywhere.
const LIGHT_PREFIXES = ["/account", "/studio", "/commission", "/login", "/forgot-password", "/reset-password"];

export function isLightRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return LIGHT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
