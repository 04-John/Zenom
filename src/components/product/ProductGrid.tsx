import { ProductCard, ProductCardData } from "./ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) {
    return (
      <EmptyState
        title="This collection is taking a little pause."
        action={
          <Link href="/portraits" className="text-copper underline">
            Explore another collection
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-10">
      {products.map((p, i) => (
        <ProductCard key={p.slug} product={p} index={i} />
      ))}
    </div>
  );
}
