import { DocumentsScreen } from "@/components/mobile/customer/DocumentsScreen";

export const metadata = { title: "Documents | Zenom Studio" };

// Customer app Documents tab (orders come from src/app/account/layout.tsx).
// A new route with no desktop design: the light column shows at every width.
export default function AccountDocumentsPage() {
  return <DocumentsScreen />;
}
