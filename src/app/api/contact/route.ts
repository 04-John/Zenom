import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { sendContactMessage } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(5).max(3000),
  // Honeypot: real visitors never see or fill this.
  website: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }

  const parsed = contactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your name, email and message." }, { status: 400 });
  }
  // Silently accept bots without sending anything.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const { website: _website, ...message } = parsed.data;
  const result = await sendContactMessage(message);
  if (!result.sent) {
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please message us on WhatsApp instead." },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true });
}
