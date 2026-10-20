import Image from "next/image";
import { PageIntro } from "@/components/motion/PageIntro";
import { Reveal } from "@/components/motion/Reveal";
import { art } from "@/lib/catalog";
import { WHATSAPP_NUMBER } from "@/lib/pricing";

export const metadata = { title: "Zenom Spaces | Coming Soon" };

const SPACES_WALL = [
  "w01", "g01", "m06", "f09", "w07", "g07", "m03", "w05", "f03",
  "g04", "m04", "w08", "f07", "w02", "g02", "m09", "f06", "w10",
].map(art);

const NOTIFY_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "I'd like to be notified when Zenom Spaces launches"
)}`;

export default function SpacesPage() {
  return (
    <>
      <PageIntro
        kicker="ZENOM SPACES"
        title="Art for spaces."
        blurb="Curated art for business interiors."
        bg="#15302A"
        ink="#EFE9DF"
        images={["f10", "f07", "g01", "m05", "f05"].map(art)}
      />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night px-6 py-36 text-center">
        <div
          aria-hidden
          className="absolute -inset-y-[10%] inset-x-0 grid grid-cols-3 gap-3.5 p-3.5 opacity-[0.16] blur-[3px] grayscale-[0.4] min-[700px]:grid-cols-6"
        >
          {SPACES_WALL.map((src, i) => (
            <div key={src} className="relative aspect-[3/4] overflow-hidden rounded-[14px]">
              <Image src={src} alt="" fill sizes="(min-width: 700px) 17vw, 33vw" className="object-cover" loading={i < 6 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(18,16,14,0.6),#12100E_75%)]" />
        <div className="relative">
          <Reveal variant="up">
            <p className="kicker">ZENOM SPACES</p>
          </Reveal>
          <Reveal variant="mask" as="h2" className="mt-[18px] font-display text-[clamp(64px,10vw,150px)] italic leading-[0.88]">
            Coming soon.
          </Reveal>
          <Reveal variant="up">
            <p className="mx-auto mb-8 mt-6 max-w-[440px] leading-[1.7] text-ink-2">
              Curated art for business interiors — bringing Zenom’s work into the spaces people gather.
            </p>
            <a href={NOTIFY_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center justify-center rounded-pill bg-ink px-[26px] py-[15px] text-sm font-semibold tracking-wide text-night transition-colors duration-200 hover:bg-ember">
              Notify me on WhatsApp
            </a>
          </Reveal>
        </div>
      </section>
    </>
  );
}
