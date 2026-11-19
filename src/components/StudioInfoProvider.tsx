"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_STUDIO_INFO, type StudioInfo } from "@/lib/studio-info";

// Hands the studio's editable details (bank, quote and drawing times) to
// client screens. Server layouts/pages load them with getStudioInfo() from
// src/lib/studio-settings.ts and wrap their tree in this provider. Outside a
// provider, useStudioInfo() returns the defaults (no bank details).
const StudioInfoContext = createContext<StudioInfo>(DEFAULT_STUDIO_INFO);

export function StudioInfoProvider({ value, children }: { value: StudioInfo; children: ReactNode }) {
  return <StudioInfoContext.Provider value={value}>{children}</StudioInfoContext.Provider>;
}

export function useStudioInfo(): StudioInfo {
  return useContext(StudioInfoContext);
}
