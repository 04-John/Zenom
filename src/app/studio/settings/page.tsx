import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ABSTRACT_PRICES,
  DELIVERY_KADUNA,
  DEPOSIT_RATE,
  FRAMING_PRICES,
  PORTRAIT_PRICES,
  PRICE_PER_ADDITIONAL_SUBJECT,
  SIZES,
  formatNaira,
} from "@/lib/pricing";
import { SettingsMobile } from "@/components/mobile/studio/SettingsMobile";

export const metadata = { title: "Studio | Zenom Studio" };

// The light app's "Studio" tab. Desktop gets a small page in the dark studio
// style (profile + price list); the admin check lives in ../layout.tsx.
export default async function StudioSettingsPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name?.trim() || "Samuel";
  const email = session?.user?.email ?? "";

  return (
    <>
      <SettingsMobile name={name} email={email} />
      <div className="max-w-2xl pb-24 pt-8 max-[900px]:hidden">
        <p className="kicker">Admin</p>
        <h1 className="h-section mt-3">Studio</h1>
        <p className="mt-4 text-sm text-ink-2">
          Signed in as {name}
          {email ? ` · ${email}` : ""} ·{" "}
          <Link href="/" className="underline hover:text-ember">
            View the live site
          </Link>
        </p>

        <section className="mt-8 rounded-card border border-ink/10 bg-night-raised p-6">
          <h2 className="label-mono">Price list</h2>
          <table className="mt-5 w-full text-left text-sm text-ink">
            <thead>
              <tr className="label-mono">
                <th className="py-2 pr-4 font-normal">Size</th>
                <th className="py-2 pr-4 font-normal">Portrait</th>
                <th className="py-2 pr-4 font-normal">Abstract</th>
                <th className="py-2 font-normal">Frame</th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map((s, i) => (
                <tr key={s.label} className="border-t border-ink/10">
                  <th scope="row" className="py-2 pr-4 font-medium">
                    {s.label}
                  </th>
                  <td className="py-2 pr-4 text-ink-2">{formatNaira(PORTRAIT_PRICES[i])}</td>
                  <td className="py-2 pr-4 text-ink-2">{formatNaira(ABSTRACT_PRICES[i])}</td>
                  <td className="py-2 text-ink-2">{formatNaira(FRAMING_PRICES[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-ink-3">
            Extra person {formatNaira(PRICE_PER_ADDITIONAL_SUBJECT)} · Kaduna delivery {formatNaira(DELIVERY_KADUNA)} ·{" "}
            {Math.round(DEPOSIT_RATE * 100)}% deposit. Prices are set in src/lib/pricing.ts.
          </p>
        </section>
      </div>
    </>
  );
}
