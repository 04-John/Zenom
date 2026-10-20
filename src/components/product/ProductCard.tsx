import Link from "next/link";
import Image from "next/image";
import { CATEGORY_LABEL, formatNaira } from "@/lib/pricing";
import type { ArtCard } from "@/lib/artworks";

// One gallery card. Respects the artwork's natural aspect ratio (masonry),
// lifts 6px with a -0.6deg tilt on hover. The "See it on a wall" shortcut is a
// sibling link (a link inside a link is invalid) that opens the detail page
// with the wall modal already open.
export function ProductCard({ art, priority = false }: { art: ArtCard; priority?: boolean }) {
  return (
    <div data-card="1" className="rv-hidden group relative mb-6 break-inside-avoid">
      <div className="relative">
        <Link
          href={art.href}
          data-cursor="View"
          data-transition-label={art.name}
          className="block text-ink hover:text-ink"
        >
          <div className="overflow-hidden rounded-[14px] bg-night-raised transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:-translate-y-1.5 group-hover:-rotate-[0.6deg] group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.55)]">
            <Image
              src={art.imageUrl}
              alt={art.name}
              width={art.width}
              height={art.height}
              priority={priority}
              sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw"
              className="block h-auto w-full"
            />
          </div>
          <div className="flex items-baseline justify-between gap-3 px-1 pt-3">
            <div className="font-display text-[24px] italic leading-tight">{art.name}</div>
            <div className="whitespace-nowrap text-[12px] text-ink-3">from {formatNaira(art.from)}</div>
          </div>
          <div className="px-1 pt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            {CATEGORY_LABEL[art.category]}
            {!art.available && <span className="text-ember"> · Currently unavailable</span>}
          </div>
        </Link>
        <Link
          href={`${art.href}?wall=1`}
          data-transition-label={art.name}
          aria-label={`See ${art.name} on a wall`}
          className="absolute right-3 top-3 rounded-pill border border-ink/15 bg-night/70 px-3 py-[7px] text-[11px] font-medium text-ink opacity-0 backdrop-blur-md transition-opacity duration-300 hover:bg-ink hover:text-night focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          See it on a wall
        </Link>
      </div>
    </div>
  );
}
