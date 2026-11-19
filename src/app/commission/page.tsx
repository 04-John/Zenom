import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SIZES, type Category } from "@/lib/pricing";
import { getStudioInfo } from "@/lib/studio-settings";
import { StudioInfoProvider } from "@/components/StudioInfoProvider";
import { LightPage } from "@/components/mobile/ui";
import { CommissionFlow, type CommissionPrefill } from "@/components/mobile/customer/commission/CommissionFlow";
import { getRooms } from "@/components/mobile/customer/server";

export const metadata = {
  title: "Start a commission | Zenom Studio",
  description: "Commission a hand-drawn portrait or abstract piece from Samuel at Zenom Studio, Kaduna. Pick a room and size, add your photo, and get your quote on WhatsApp.",
};
export const dynamic = "force-dynamic";

const ROOM_PARAM: Record<string, Category> = {
  portrait: "portrait",
  portraits: "portrait",
  geometric: "geometric",
  minimalistic: "minimalistic",
  figurative: "figurative",
};

// The light app's commission request: welcome → 4 steps → request received.
// Public (no sign-in needed). Signed-in customers get their name, email,
// last WhatsApp number and address pre-filled, and the order is linked to
// their account by /api/orders.
//   ?start=1                 skip the welcome screen
//   &room=portrait|geometric|minimalistic|figurative   pre-pick the room
//   &size=0..5               pre-pick the size (16×20 = 2)
export default async function CommissionPage({ searchParams }: { searchParams: { start?: string; room?: string; size?: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; name?: string | null; email?: string | null } | undefined;

  let last: { customerPhone: string; deliveryAddress: string } | null = null;
  if (user?.id) {
    try {
      last = await prisma.order.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { customerPhone: true, deliveryAddress: true },
      });
    } catch (err) {
      console.error("Commission prefill failed:", err);
    }
  }

  const [rooms, info] = await Promise.all([getRooms(), getStudioInfo()]);
  const sizeNum = Number(searchParams.size);
  const prefill: CommissionPrefill = {
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: last?.customerPhone ?? "",
    address: last && last.deliveryAddress !== "To confirm on WhatsApp" ? last.deliveryAddress : "",
    room: searchParams.room ? ROOM_PARAM[searchParams.room.toLowerCase()] : undefined,
    size: Number.isInteger(sizeNum) && sizeNum >= 0 && sizeNum < SIZES.length && searchParams.size !== "" && searchParams.size != null ? sizeNum : undefined,
  };

  return (
    <StudioInfoProvider value={info}>
      <LightPage desktop="column" className="min-[900px]:pt-24">
        <CommissionFlow rooms={rooms} prefill={prefill} start={searchParams.start === "1"} signedIn={!!user?.id} />
      </LightPage>
    </StudioInfoProvider>
  );
}
