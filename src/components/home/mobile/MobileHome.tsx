import Image from "next/image";
import Link from "next/link";
import { ART_GROUPS, art } from "@/lib/catalog";
import { DELIVERY_KADUNA, SIZES, formatNaira, startingPrice, type Category } from "@/lib/pricing";
import { MobileHero } from "./MobileHero";

// The minimal home below 900px (reference: Main.dc.html / Prototype "home"),
// replacing the five pinned scroll chapters: hero, the rooms as a 4-row list,
// "How it works" in 4 steps, a pricing card and a closing CTA. Static: room
// counts come from the catalogue (ART_GROUPS), prices from lib/pricing.

const ROOMS: { n: string; category: Category; href: string; img: string }[] = [
  { n: "01", category: "portrait", href: "/portraits", img: "w01" },
  { n: "02", category: "geometric", href: "/abstract?style=geometric", img: "g01" },
  { n: "03", category: "minimalistic", href: "/abstract?style=minimalistic", img: "m01" },
  { n: "04", category: "figurative", href: "/abstract?style=figurative", img: "f01" },
];

const STEPS = [
  { n: "01", title: "Choose or send a photo", body: "Pick a piece from the rooms, or send the photo you want drawn." },
  {
    n: "02",
    title: "Pick a size",
    body: `Six sizes from ${SIZES[0].label} to ${SIZES[SIZES.length - 1].label} in, framed or paper only.`,
  },
  {
    n: "03",
    title: "Confirm on WhatsApp",
    body: "Every detail is agreed with you directly. A 50% non-refundable deposit starts the work.",
  },
  { n: "04", title: "On your wall", body: "Sketched, shaded and finished by hand, then delivered." },
];

// Phones only; the hidden desktop copy asks for a 1px candidate.
const thumb = (px: number) => `(max-width: 899.98px) ${px}px, 1px`;

export function MobileHome() {
  const from = formatNaira(Math.min(startingPrice("portrait"), startingPrice("geometric")));

  return (
    <>
      <MobileHero />

      <section aria-labelledby="m-rooms" className="flex flex-col gap-7 px-6 pb-6 pt-[72px]">
        <div className="flex flex-col gap-3">
          <p className="zk text-ember">The rooms</p>
          <h2 id="m-rooms" className="zs text-[30px] leading-[1.05] text-ink">
            Four rooms,
            <br />
            one studio.
          </h2>
        </div>
        <ul className="flex flex-col">
          {ROOMS.map((r) => {
            const group = ART_GROUPS.find((g) => g.category === r.category);
            const count = group?.titles.length ?? 0;
            return (
              <li key={r.category} className="border-t border-ink/10">
                <Link href={r.href} className="zf flex items-center gap-4 rounded-md py-4 text-ink hover:text-ink">
                  <span className="zk w-[22px] flex-none tracking-[0.1em] text-ink-3">{r.n}</span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="zs text-[22px] leading-[1.1]">{group?.label}</span>
                    <span className="text-[13px] text-ink-3">
                      {count} works · from {formatNaira(startingPrice(r.category))}
                    </span>
                  </span>
                  <span className="relative h-20 w-16 flex-none overflow-hidden rounded-[10px] bg-night-raised">
                    <Image src={art(r.img)} alt="" fill sizes={thumb(64)} className="object-cover" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="m-how" className="flex flex-col gap-7 px-6 pb-6 pt-16">
        <div className="flex flex-col gap-3">
          <p className="zk text-ember">How it works</p>
          <h2 id="m-how" className="zs text-[30px] leading-[1.05] text-ink">
            From blank sheet
            <br />
            to your wall.
          </h2>
        </div>
        <div className="relative h-[300px] overflow-hidden rounded-[20px] bg-night-raised">
          <Image src={art("w07")} alt="A finished charcoal portrait by Samuel" fill sizes={thumb(430)} className="object-cover" style={{ objectPosition: "50% 30%" }} />
        </div>
        <ol className="flex flex-col">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4 border-t border-ink/10 py-[18px]">
              <span className="zk w-[22px] flex-none pt-1 tracking-[0.1em] text-ember">{s.n}</span>
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="text-[17px] font-medium leading-snug text-ink">{s.title}</span>
                <span className="text-[14px] leading-[1.6] text-ink-2">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="m-pricing" className="mx-6 mt-12 flex flex-col gap-3.5 rounded-card bg-paper px-6 py-7 text-paper-ink">
        <p className="zk text-rust">Pricing</p>
        <p id="m-pricing" className="zn text-[32px] leading-none">
          from {from}
        </p>
        <p className="text-[14px] leading-[1.6] text-paper-ink-2">
          Six sizes, {SIZES[0].label} to {SIZES[SIZES.length - 1].label} in. Framing optional. {formatNaira(DELIVERY_KADUNA)} delivery in
          Kaduna.
        </p>
        <Link
          href="/pricing"
          className="zf mt-1 flex h-11 items-center self-start rounded-pill border border-paper-ink px-5 text-[14px] font-medium text-paper-ink hover:bg-paper-ink hover:text-paper"
        >
          See the price list
        </Link>
      </section>

      <section aria-labelledby="m-cta" className="flex flex-col items-center gap-6 px-6 pb-16 pt-24 text-center">
        <h2 id="m-cta" className="zs text-[32px] leading-[1.05] text-ink">
          Let&rsquo;s commission
          <br />
          something.
        </h2>
        <p className="max-w-[280px] text-[14px] leading-[1.6] text-ink-2">
          Send a photo and pick a size. Samuel confirms the details and price with you on WhatsApp.
        </p>
        <Link
          href="/commission"
          className="zf flex h-[54px] w-full items-center justify-center rounded-pill bg-ember text-[15px] font-semibold text-night hover:bg-ink hover:text-night"
        >
          Start a commission
        </Link>
      </section>
    </>
  );
}
