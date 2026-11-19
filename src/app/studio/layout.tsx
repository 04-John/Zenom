import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getStudioAlerts } from "@/lib/studio-stats";
import { StudioMobileProvider } from "@/components/mobile/studio/StudioMobileProvider";
import { StudioNav } from "./StudioNav";

// One server-side admin check for every /studio page (middleware also
// enforces it; this covers direct renders and gives a clean redirect).
//
// Two layouts share this tree: from 900px up, the existing dark studio
// (container + StudioNav); below 900px each page renders the light studio
// app, whose tab bar, notifications and push banner live in
// StudioMobileProvider (hidden on desktop).
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login?callbackUrl=/studio");

  // The phone chrome (badge, notifications, push banner) must never take the studio down.
  const alerts = await getStudioAlerts()
    .then((a) => ({ ...a, ok: true }))
    .catch(() => ({ pendingCount: 0, notices: [], newest: [], ok: false }));

  return (
    <StudioMobileProvider pendingCount={alerts.pendingCount} notices={alerts.notices} newest={alerts.newest} live={alerts.ok}>
      <div className="mx-auto max-w-container px-6 pt-[120px] lg:px-10 max-[900px]:max-w-none max-[900px]:p-0">
        <div className="max-[900px]:hidden">
          <StudioNav name={session.user?.name ?? "Samuel"} />
        </div>
        {children}
      </div>
    </StudioMobileProvider>
  );
}
