import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { authOptions } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Signed direct-to-Cloudinary upload: the browser uploads the file
// straight to Cloudinary using this signature, so the image never has
// to pass through a Netlify function (which has a request body size
// limit) and the API secret never reaches the client.
//
// Three purposes:
//  - default (no body): admin artwork images, admin only.
//  - { purpose: "progress" }: sketch / shading / finished photos Samuel
//    shares on an order (POST /api/orders/[id]/photos), admin only.
//  - { purpose: "commission" }: a customer's reference photo for a
//    commission request (/commission). Open to guests, so it is rate
//    limited per IP, signed for its own folder and restricted to images.
const UPLOAD_FOLDER = "zenom-studio/products";
const PROGRESS_FOLDER = "zenom-studio/progress";
// Formats every browser can show (no HEIC: it only displays in Safari).
const PROGRESS_FORMATS = "jpg,jpeg,png,webp";
const COMMISSION_FOLDER = "zenom-studio/commissions";
const COMMISSION_FORMATS = "jpg,jpeg,png,webp,heic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const commission = body?.purpose === "commission";
  const progress = body?.purpose === "progress";

  if (commission) {
    const { allowed } = rateLimit(`upload:${clientIp(req)}`, 8, 10 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json({ error: "Too many uploads. Please try again shortly." }, { status: 429 });
    }
  } else {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: "Image upload is not configured." }, { status: 501 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = commission
    ? { timestamp, folder: COMMISSION_FOLDER, allowed_formats: COMMISSION_FORMATS }
    : progress
      ? { timestamp, folder: PROGRESS_FOLDER, allowed_formats: PROGRESS_FORMATS }
      : { timestamp, folder: UPLOAD_FOLDER };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

  // Every signed param must be sent back to Cloudinary with the file.
  return NextResponse.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: params.folder,
    ...(commission && { allowedFormats: COMMISSION_FORMATS }),
    ...(progress && { allowedFormats: PROGRESS_FORMATS }),
  });
}
