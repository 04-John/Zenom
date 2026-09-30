import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy px-6 py-16 text-ivory lg:px-10">
      <div className="mx-auto grid max-w-container gap-12 md:grid-cols-4">
        <div>
          <p className="font-display text-xl">ZENOM STUDIO</p>
          <p className="mt-2 text-sm text-ivory/60">Art for People, Art for Spaces.</p>
        </div>
        <FooterCol title="Shop" links={[{ href: "/portraits", label: "Portraits" }]} />
        <FooterCol
          title="Help"
          links={[
            { href: "/account", label: "My Account" },
            { href: "/account/orders", label: "My Orders" },
          ]}
        />
        <FooterCol
          title="Connect"
          links={[
            { href: "https://wa.me/2349048528199", label: "WhatsApp" },
            { href: "https://instagram.com/zenom.studio", label: "Instagram" },
            { href: "mailto:zenomart.studio@gmail.com", label: "Email" },
          ]}
        />
      </div>
      <p className="mx-auto mt-12 max-w-container text-xs text-ivory/40">
        © {new Date().getFullYear()} Zenom Studio. All rights reserved.
      </p>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wide text-copper">{title}</p>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-ivory/70 hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
