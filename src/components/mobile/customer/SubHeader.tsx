import Link from "next/link";
import { Icon } from "@/components/mobile/ui";

/** Sub-screen header: rust "‹ Back" on the left, centred title (Settings, Help). */
export function SubHeader({ href, back, title }: { href: string; back: string; title: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", paddingTop: "var(--m-top)" }}>
      <Link
        href={href}
        aria-label={`Back to ${back}`}
        style={{ justifySelf: "start", display: "flex", alignItems: "center", gap: 4, font: "600 15px 'Instrument Sans', sans-serif", color: "#9A4A1F", padding: "10px 0", minHeight: 44, textDecoration: "none" }}
      >
        <Icon name="back" size={18} stroke={2} />
        {back}
      </Link>
      <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h1>
      <span />
    </div>
  );
}
