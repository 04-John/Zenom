import { PricingScreen } from "@/components/mobile/customer/PricingScreen";
import { getRooms } from "@/components/mobile/customer/server";

export const metadata = { title: "Pricing | Zenom Studio" };
export const dynamic = "force-dynamic";

// Customer app Pricing tab. A new route with no desktop design, so the light
// column shows at every width (the tab bar only below 900px).
export default async function AccountPricingPage() {
  const rooms = await getRooms();
  return <PricingScreen rooms={rooms} />;
}
