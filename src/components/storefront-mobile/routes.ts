// Route helpers for the dark storefront below 900px (see the mobile handoff,
// "A. Dark storefront"). Used by the page transition (push/pop by depth) and
// by the mobile top bar (where Back falls back to when there is no in-app
// history to go back to).

/** Below this width the mobile storefront takes over. */
export const MOBILE_MAX = 900;

/** The whole gallery ("All" filter) on mobile. */
export const GALLERY_ALL = "/abstract?style=all";

const ARTWORK = /^\/(portraits|abstract)\/[^/]+$/;
const LISTING = /^\/(portraits|abstract|pricing|contact|spaces|portfolio|privacy|terms|signup)$/;

/**
 * Navigation depth: home 0 → listing pages 1 → artwork 2 → bag/checkout 3.
 * Going deeper pushes, going up pops, same depth fades. `null` = not part of
 * the storefront stack (light-app routes and anything unknown).
 */
export function storefrontDepth(path: string): number | null {
  if (path === "/") return 0;
  if (ARTWORK.test(path)) return 2;
  if (path === "/cart" || path === "/checkout") return 3;
  if (LISTING.test(path)) return 1;
  return null;
}

export const isArtworkPath = (path: string) => ARTWORK.test(path);
export const isBagPath = (path: string) => path === "/cart" || path === "/checkout";

/** Where the mobile Back button goes when there is no in-app history. */
export function parentRoute(path: string): string {
  if (path.startsWith("/portraits/")) return "/portraits";
  if (path.startsWith("/abstract/")) return "/abstract";
  return "/";
}
