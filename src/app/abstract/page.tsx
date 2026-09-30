import { Reveal } from "@/components/motion/Reveal";

export const metadata = { title: "Zenom Abstract | Coming Soon" };

// Real route, real brand content — but no product listing, no pricing,
// no cart entry point. Flip NEXT_PUBLIC_ABSTRACT_LIVE (or the DB-backed
// settings flag) when the gallery and pricing are finalized.
export default function AbstractComingSoonPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-navy px-6 text-center">
      <Reveal>
        <p className="text-sm uppercase tracking-[0.3em] text-copper">Zenom Abstract</p>
        <h1 className="mt-4 font-display text-4xl text-ivory lg:text-5xl">Coming Soon</h1>
        <p className="mx-auto mt-6 max-w-md text-ivory/70">
          Pencil and color-pencil recreations of your favourite reference art —
          minimalist, figurative, and geometric abstract pieces, made to order.
        </p>
        <a
          href="https://wa.me/2349048528199?text=I'd%20like%20to%20be%20notified%20when%20Zenom%20Abstract%20launches"
          className="mt-8 inline-block text-sm text-copper underline"
        >
          Get notified on WhatsApp
        </a>
      </Reveal>
    </div>
  );
}
