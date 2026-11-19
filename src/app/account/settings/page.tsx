import { SettingsScreen } from "@/components/mobile/customer/SettingsScreen";

export const metadata = { title: "Settings | Zenom Studio" };

// Customer app Settings (Account → Settings). New route, light column at every width.
export default function AccountSettingsPage() {
  return <SettingsScreen />;
}
