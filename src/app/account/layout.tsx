import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStudioInfo } from "@/lib/studio-settings";
import { StudioInfoProvider } from "@/components/StudioInfoProvider";
import { CustomerChrome } from "@/components/mobile/customer/CustomerChrome";
import { getCustomerOrders } from "@/components/mobile/customer/server";
import type { CustomerOrder } from "@/components/mobile/customer/model";

export const dynamic = "force-dynamic";

// The customer's light app shell (below 900px): bottom tab bar, the
// needs-your-action / notifications sheets and the push banner. The order
// list loaded here also feeds the mobile Orders, Documents and Account tabs.
// Signed out, /account renders the sign-in page and no chrome. The studio's
// details (bank, quote and drawing times) reach every account screen through
// StudioInfoProvider / useStudioInfo().
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string | null; email?: string | null } | undefined;
  const [orders, info] = await Promise.all([
    user?.id ? getCustomerOrders(user.id) : Promise.resolve<CustomerOrder[]>([]),
    getStudioInfo(),
  ]);

  return (
    <StudioInfoProvider value={info}>
      <CustomerChrome signedIn={!!user?.id} user={{ name: user?.name ?? null, email: user?.email ?? null }} orders={orders}>
        {children}
      </CustomerChrome>
    </StudioInfoProvider>
  );
}
