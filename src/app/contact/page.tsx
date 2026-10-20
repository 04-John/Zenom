import { ZenomLockup } from "@/components/brand/ZenomLockup";
import { PageIntro } from "@/components/motion/PageIntro";
import { Reveal } from "@/components/motion/Reveal";
import { ContactForm } from "./ContactForm";
import { art } from "@/lib/catalog";
import { WHATSAPP_NUMBER } from "@/lib/pricing";

export const metadata = { title: "Contact | Zenom Studio" };

const CARDS = [
  { label: "WHATSAPP", value: "+234 904 852 8199", href: `https://wa.me/${WHATSAPP_NUMBER}`, external: true, small: false },
  { label: "INSTAGRAM", value: "@zenom.studio", href: "https://instagram.com/zenom.studio", external: true, small: false },
  { label: "EMAIL", value: "zenomart.studio@gmail.com", href: "mailto:zenomart.studio@gmail.com", external: false, small: true },
];

export default function ContactPage() {
  return (
    <>
      <PageIntro
        kicker="CONTACT"
        title="Let’s talk."
        blurb="Commissions, questions about a piece, or anything else. WhatsApp is the fastest way to reach the studio."
        bg="#E58A52"
        ink="#12100E"
        images={["w07", "f01", "m02", "g04", "w06"].map(art)}
      />
      <div className="bg-night">
        <div className="mx-auto max-w-[1180px] px-6 pb-36 pt-16">
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            {CARDS.map((c) => (
              <Reveal key={c.label} variant="toss">
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  data-cursor="TALK"
                  className="flex h-full flex-col gap-10 rounded-card border border-ink/[0.08] bg-night-raised p-[26px] transition-colors hover:border-ember"
                >
                  <div className="flex justify-between font-mono text-[10px] tracking-[0.22em] text-ink-3">
                    <span>{c.label}</span>
                    <span className="text-ember">↗</span>
                  </div>
                  <div className={c.small ? "break-all font-display text-[26px]" : "font-display text-[32px]"}>
                    {c.value}
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
          <Reveal variant="up" className="mt-14">
            <ZenomLockup variant="badge" size={0.5} className="mb-6" />
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </>
  );
}
