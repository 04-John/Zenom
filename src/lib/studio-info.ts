// Studio-wide details Samuel edits in the Studio tab (bank details for the
// deposit, how fast quotes go out, how long drawing takes). Stored in the
// StudioSettings table; loaded on the server by src/lib/studio-settings.ts
// and handed to client screens through <StudioInfoProvider> /
// useStudioInfo(). Client-safe: no Prisma or server imports.

export type BankDetails = { bank: string; accountName: string; accountNumber: string };

export type StudioInfo = {
  /** null until all three bank fields are filled in the Studio tab. */
  bank: BankDetails | null;
  quoteHours: number;
  drawingDays: number;
  /** "within 24 hours", "within 2 days" */
  quoteTurnaround: string;
  /** "about 10 days" */
  drawingTime: string;
};

export const DEFAULT_QUOTE_HOURS = 24;
export const DEFAULT_DRAWING_DAYS = 10;
export const QUOTE_HOURS_RANGE = { min: 1, max: 336 } as const; // up to 2 weeks
export const DRAWING_DAYS_RANGE = { min: 1, max: 120 } as const;

export function quoteTurnaroundText(hours: number): string {
  if (hours > 24 && hours % 24 === 0) return `within ${hours / 24} days`;
  return `within ${hours} hour${hours === 1 ? "" : "s"}`;
}

export function drawingTimeText(days: number): string {
  return `about ${days} day${days === 1 ? "" : "s"}`;
}

type SettingsRow = {
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  quoteHours: number;
  drawingDays: number;
};

export function toStudioInfo(row: SettingsRow | null | undefined): StudioInfo {
  const bankName = row?.bankName?.trim() ?? "";
  const accountName = row?.bankAccountName?.trim() ?? "";
  const accountNumber = row?.bankAccountNumber?.trim() ?? "";
  const quoteHours = row?.quoteHours ?? DEFAULT_QUOTE_HOURS;
  const drawingDays = row?.drawingDays ?? DEFAULT_DRAWING_DAYS;
  return {
    bank: bankName && accountName && accountNumber ? { bank: bankName, accountName, accountNumber } : null,
    quoteHours,
    drawingDays,
    quoteTurnaround: quoteTurnaroundText(quoteHours),
    drawingTime: drawingTimeText(drawingDays),
  };
}

export const DEFAULT_STUDIO_INFO: StudioInfo = toStudioInfo(null);
