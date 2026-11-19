import { ZenomSpinner } from "@/components/brand/ZenomSpinner";

// Paper-world route from 900px: spinner on paper so the page doesn't flash
// dark. Below 900px the bag is a dark screen, so the spinner is too.
export default function Loading() {
  return (
    <>
      <div className="flex min-h-[70vh] items-center justify-center bg-paper max-[900px]:hidden">
        <ZenomSpinner size={120} label="Drawing…" tone="paper" />
      </div>
      <div className="flex min-h-[70vh] items-center justify-center bg-night min-[900px]:hidden">
        <ZenomSpinner size={120} label="Drawing…" />
      </div>
    </>
  );
}
