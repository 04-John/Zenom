import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Samuel removes a progress photo from an order (the image stays in
// Cloudinary; only the link on the order goes).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; photoId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { count } = await prisma.orderPhoto.deleteMany({ where: { id: params.photoId, orderId: params.id } });
  if (!count) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
