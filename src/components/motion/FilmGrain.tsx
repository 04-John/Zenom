// Fixed film-grain overlay: SVG feTurbulence as a background, 7% opacity,
// overlay blend, never intercepts the pointer (styles in globals.css).
export function FilmGrain() {
  return <div aria-hidden className="film-grain" />;
}
