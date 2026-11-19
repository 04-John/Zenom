import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CustomerChrome } from "@/components/mobile/customer/CustomerChrome";
import { getCustomerOrders } from "@/components/mobile/customer/server";
import type { CustomerOrder } from "@/components/mobile/customer/model";

export const dynamic = "force-dynamic";

// The customer's light app shell (below 900px): bottom tab bar, the
// needs-your-action / notifications sheets and the push banner. The order
// list loaded here also feeds the mobile Orders, Documents and Account tabs.
// Signed out, /account renders the sign-in page and no chrome.
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string | null; email?: string | null } | undefined;
  const orders: CustomerOrder[] = user?.id ? await getCustomerOrders(user.id) : [];

  return (
    <CustomerChrome signedIn={!!user?.id} user={{ name: user?.name ?? null, email: user?.email ?? null }} orders={orders}>
      {children}
    </CustomerChrome>
  );
}
