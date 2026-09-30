import { Reveal } from "@/components/motion/Reveal";

export const metadata = { title: "Zenom Spaces | Coming Soon" };

export default function SpacesComingSoonPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-navy px-6 text-center">
      <Reveal>
        <p className="text-sm uppercase tracking-[0.3em] text-copper">Zenom Spaces</p>
        <h1 className="mt-4 font-display text-4xl text-ivory lg:text-5xl">Coming Soon</h1>
        <p className="mx-auto mt-6 max-w-md text-ivory/70">
          Curated art for business interiors — bringing Zenom&rsquo;s work into the spaces people gather.
        </p>
        <a
          href="https://wa.me/2349048528199?text=I'd%20like%20to%20be%20notified%20when%20Zenom%20Spaces%20launches"
          className="mt-8 inline-block text-sm text-copper underline"
        >
          Get notified on WhatsApp
        </a>
      </Reveal>
    </div>
  );
}
