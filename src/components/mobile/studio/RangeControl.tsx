"use client";

import { SegSmall } from "@/components/mobile/ui";
import type { RangeKey } from "@/lib/studio-stats";

const ITEMS: { key: RangeKey; label: string }[] = [
  { key: "7", label: "7d" },
  { key: "30", label: "30d" },
  { key: "90", label: "90d" },
  { key: "all", label: "All" },
];

/** 7d / 30d / 90d / All, driven by ?range= (server data). */
export function RangeControl({ value }: { value: RangeKey }) {
  return <SegSmall label="Date range" items={ITEMS} value={value} hrefFor={(k) => `/studio?range=${k}`} />;
}
