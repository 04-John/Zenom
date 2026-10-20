import { ZenomSpinner } from "@/components/brand/ZenomSpinner";

// Paper-world route: spinner on paper so the page doesn't flash dark.
export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-paper">
      <ZenomSpinner size={120} label="Drawing…" tone="paper" />
    </div>
  );
}
