// Fixed film-grain overlay: SVG feTurbulence as a background, overlay blend,
// never intercepts the pointer. 7% opacity from 900px, 9% below (the mobile
// storefront reference); styles in globals.css.
export function FilmGrain() {
  return <div aria-hidden className="film-grain" />;
}
