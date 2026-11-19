import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STUDIO_SETTINGS_ID } from "@/lib/studio-settings";
import { DRAWING_DAYS_RANGE, QUOTE_HOURS_RANGE, toStudioInfo } from "@/lib/studio-info";

// Studio tab: bank details for deposits and the quote / drawing times that
// customers see. Admin only. Empty bank fields are saved as "not set"; the
// customer app shows bank details only once all three are filled in.
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

const schema = z.object({
  bankName: text(80),
  bankAccountName: text(120),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^(\d{6,20})?$/, "Account number: digits only")
    .transform((v) => v || null),
  quoteHours: z.number().int().min(QUOTE_HOURS_RANGE.min).max(QUOTE_HOURS_RANGE.max),
  drawingDays: z.number().int().min(DRAWING_DAYS_RANGE.min).max(DRAWING_DAYS_RANGE.max),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = String(issue?.path[0] ?? "");
    const error =
      field === "bankAccountNumber"
        ? "The account number should be digits only."
        : field === "quoteHours"
          ? `Quote time must be between ${QUOTE_HOURS_RANGE.min} and ${QUOTE_HOURS_RANGE.max} hours.`
          : field === "drawingDays"
            ? `Drawing time must be between ${DRAWING_DAYS_RANGE.min} and ${DRAWING_DAYS_RANGE.max} days.`
            : "Please check the details and try again.";
    return NextResponse.json({ error }, { status: 400 });
  }

  const row = await prisma.studioSettings.upsert({
    where: { id: STUDIO_SETTINGS_ID },
    update: parsed.data,
    create: { id: STUDIO_SETTINGS_ID, ...parsed.data },
  });
  return NextResponse.json({ settings: row, info: toStudioInfo(row) });
}
