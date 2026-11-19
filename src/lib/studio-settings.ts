// Server side of src/lib/studio-info.ts: reads the single StudioSettings row.
// Never throws: if the row doesn't exist yet (or the database can't be read)
// the defaults apply, so a customer page never fails over bank details.
import { prisma } from "@/lib/prisma";
import { toStudioInfo, type StudioInfo } from "@/lib/studio-info";

export const STUDIO_SETTINGS_ID = "studio";

export async function getStudioSettingsRow() {
  try {
    return await prisma.studioSettings.findUnique({ where: { id: STUDIO_SETTINGS_ID } });
  } catch (err) {
    console.error("Studio settings could not be read:", err);
    return null;
  }
}

export async function getStudioInfo(): Promise<StudioInfo> {
  return toStudioInfo(await getStudioSettingsRow());
}
