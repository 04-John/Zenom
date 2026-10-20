import { ZenomSpinner } from "@/components/brand/ZenomSpinner";

// Next.js App Router route-level loading UI. Copy this file into any route
// folder that fetches data (e.g. app/portraits, app/abstract, app/account).
export default function Loading() {
  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ZenomSpinner size={120} label="Drawing…" />
    </div>
  );
}
