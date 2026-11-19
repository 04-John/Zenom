import { prisma } from "@/lib/prisma";
import { MobileProductForm } from "@/components/mobile/studio/MobileProductForm";
import { ProductForm } from "../ProductForm";

const PREFIX: Record<string, string> = { PORTRAIT: "W", GEOMETRIC: "G", MINIMALISTIC: "M", FIGURATIVE: "F" };
const CATEGORIES = ["PORTRAIT", "GEOMETRIC", "MINIMALISTIC", "FIGURATIVE"] as const;

export default async function NewProductPage({ searchParams }: { searchParams: { category?: string } }) {
  // Suggest the next archive code per category (ZS-W13, ZS-G08, ...).
  const rows = await prisma.product.findMany({ select: { archiveCode: true } });
  const suggestedCodes: Record<string, string> = {};
  for (const [cat, p] of Object.entries(PREFIX)) {
    const max = rows.reduce((m, r) => {
      const n = r.archiveCode?.match(new RegExp(`^ZS-${p}(\d+)$`, "i"))?.[1];
      return n ? Math.max(m, Number(n)) : m;
    }, 0);
    suggestedCodes[cat] = `ZS-${p}${String(max + 1).padStart(2, "0")}`;
  }
  // The phone's "+" from a filtered Artworks list starts in that category.
  const defaultCategory = CATEGORIES.find((c) => c === searchParams.category);

  return (
    <>
      {/* Light studio app below 900px. */}
      <MobileProductForm suggestedCodes={suggestedCodes} defaultCategory={defaultCategory} />
      <div className="max-w-2xl pb-24 pt-8 max-[900px]:hidden">
        <h1 className="h-section">Add artwork</h1>
        <ProductForm suggestedCodes={suggestedCodes} />
      </div>
    </>
  );
}
