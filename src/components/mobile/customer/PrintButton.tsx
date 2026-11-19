"use client";

import { Cta } from "@/components/mobile/ui";

export function PrintButton() {
  return (
    <Cta tone="ember" onClick={() => window.print()}>
      Print / Save as PDF
    </Cta>
  );
}
