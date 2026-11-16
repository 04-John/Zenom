import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { StudioNav } from "./StudioNav";

// One server-side admin check for every /studio page (middleware also
// enforces it; this covers direct renders and gives a clean redirect).
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") redirect("/login?callbackUrl=/studio");

  return (
    <div className="mx-auto max-w-container px-6 pt-[120px] lg:px-10">
      <StudioNav name={session.user?.name ?? "Samuel"} />
      {children}
    </div>
  );
}
