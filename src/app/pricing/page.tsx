import { PageIntro } from "@/components/motion/PageIntro";
import { PricingCalculator } from "@/components/product/PricingCalculator";
import { art } from "@/lib/catalog";
import { DELIVERY_KADUNA, formatNaira } from "@/lib/pricing";

export const metadata = { title: "Pricing | Zenom Studio" };

export default function PricingPage() {
  return (
    <>
      <PageIntro
        kicker="PRICE LIST"
        title="Simple, by the inch."
        blurb={`Framing is optional. Delivery within Kaduna is ${formatNaira(DELIVERY_KADUNA)}; outside Kaduna it is quoted on WhatsApp.`}
        bg="#ECE5D8"
        ink="#1A1714"
        images={["w02", "g07", "m06", "f09", "w08"].map(art)}
      />
      <PricingCalculator />
    </>
  );
}
