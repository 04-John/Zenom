import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

// Homepage: editorial hero, Portraits featured, Abstract/Spaces teased
// as Coming Soon rather than hidden entirely — the three-pillar brand
// stays honest without shipping half-built commerce flows.
export default function HomePage() {
  return (
    <div>
      <section className="relative flex min-h-[85vh] items-end bg-navy px-6 pb-20 lg:px-10">
        <div className="max-w-container mx-auto w-full">
          <Reveal>
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-copper">Zenom Studio</p>
            <h1 className="max-w-2xl font-display text-5xl leading-tight text-ivory lg:text-7xl">
              Art for People, Art for Spaces.
            </h1>
            <p className="mt-6 max-w-md text-ivory/70">
              Commissioned charcoal and pencil portraits, made with intention — worn on your walls.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/portraits">
                <Button>Explore Portraits</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-container px-6 py-24 lg:px-10">
        <Reveal>
          <h2 className="font-display text-3xl text-navy">Zenom Portraits</h2>
          <p className="mt-2 max-w-lg text-charcoal/70">
            Each piece is commissioned to order — choose a size, a background treatment, and we&rsquo;ll
            confirm every detail with you directly.
          </p>
        </Reveal>
        <div className="mt-10">
          <Link href="/portraits" className="text-copper underline">
            View the full collection →
          </Link>
        </div>
      </section>

      <section className="grid gap-px bg-charcoal/10 md:grid-cols-2">
        <ComingSoonTile title="Zenom Abstract" href="/abstract" />
        <ComingSoonTile title="Zenom Spaces" href="/spaces" />
      </section>
    </div>
  );
}

function ComingSoonTile({ title, href }: { title: string; href: string }) {
  return (
    <Link href={href} className="group relative flex min-h-[320px] items-end bg-navy p-10">
      <div>
        <p className="font-display text-2xl text-ivory">{title}</p>
        <p className="mt-2 text-xs uppercase tracking-widest text-copper">Coming Soon</p>
      </div>
    </Link>
  );
}
