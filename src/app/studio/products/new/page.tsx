import { prisma } from "@/lib/prisma";
import { ProductForm } from "../ProductForm";

const PREFIX: Record<string, string> = { PORTRAIT: "W", GEOMETRIC: "G", MINIMALISTIC: "M", FIGURATIVE: "F" };

export default async function NewProductPage() {
  // Suggest the next archive code per category (ZS-W13, ZS-G08, ...).
  const rows = await prisma.product.findMany({ select: { archiveCode: true } });
  const suggestedCodes: Record<string, string> = {};
  for (const [cat, p] of Object.entries(PREFIX)) {
    const max = rows.reduce((m, r) => {
      const n = r.archiveCode?.match(new RegExp(`^ZS-${p}(\\d+)$`, "i"))?.[1];
      return n ? Math.max(m, Number(n)) : m;
    }, 0);
    suggestedCodes[cat] = `ZS-${p}${String(max + 1).padStart(2, "0")}`;
  }

  return (
    <div className="max-w-2xl pb-24 pt-8">
      <h1 className="h-section">Add artwork</h1>
      <ProductForm suggestedCodes={suggestedCodes} />
    </div>
  );
}
