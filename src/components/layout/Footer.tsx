import Link from "next/link";
import { ZenomLockup } from "@/components/brand/ZenomLockup";
import { Reveal } from "@/components/motion/Reveal";
import { WHATSAPP_NUMBER } from "@/lib/pricing";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/portraits", label: "Portraits" },
      { href: "/abstract", label: "Abstract" },
      { href: "/pricing", label: "Pricing" },
      { href: "/spaces", label: "Spaces" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/account", label: "My Account" },
      { href: "/account/orders", label: "My Orders" },
      { href: "/cart", label: "Order Bag" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
  {
    title: "Connect",
    links: [
      { href: "/contact", label: "Contact" },
      { href: `https://wa.me/${WHATSAPP_NUMBER}`, label: "WhatsApp", external: true },
      { href: "https://instagram.com/zenom.studio", label: "Instagram", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative z-[2] overflow-hidden border-t border-ink/[0.06] bg-night-deep px-6 pt-20">
      <div className="mx-auto grid max-w-container gap-10 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <Reveal className="min-w-[240px] [grid-column:span_2]">
          <ZenomLockup variant="horizontal" tone="dark" size={0.6} className="-ml-3 mb-7" />
          <div className="font-display text-4xl italic leading-none text-ink">More than a portrait.</div>
          <p className="mt-3 text-[13px] text-ink-3">Art for people, art for spaces. Kaduna, Nigeria.</p>
        </Reveal>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-ember">{col.title}</div>
            <div className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  {...("external" in l ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="text-sm text-ink-2 hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 flex max-w-container flex-wrap justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-4">
        <span>© {new Date().getFullYear()} Zenom Studio. All rights reserved.</span>
        <span>Drawn by hand in Kaduna</span>
      </div>

      {/* Giant wordmark filled with an artwork via background-clip:text. */}
      <div className="mt-6 flex justify-center overflow-hidden" style={{ height: "clamp(120px,22vw,330px)" }}>
        <Reveal variant="rise" className="flex justify-center">
          <span
            className="font-display italic"
            style={{
              fontSize: "clamp(180px,34vw,520px)",
              lineHeight: 0.86,
              letterSpacing: "-0.03em",
              whiteSpace: "nowrap",
              backgroundImage: "url(/_next/image?url=%2Fart%2Fw07.jpg&w=1080&q=70)",
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Zenom
          </span>
        </Reveal>
      </div>
    </footer>
  );
}
