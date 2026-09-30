import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";

export type ProductCardData = {
  slug: string;
  name: string;
  imageUrl: string;
  basePrice: number;
  status: "AVAILABLE" | "SOLD_OUT" | "DRAFT" | "COMING_SOON";
  archiveCode?: string | null;
};

export function ProductCard({ product, index = 0 }: { product: ProductCardData; index?: number }) {
  const unavailable = product.status !== "AVAILABLE";

  return (
    <Reveal delay={index * 0.06}>
      <Link
        href={`/portraits/${product.slug}`}
        className="group block"
        aria-disabled={unavailable}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-navy/5">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 ease-editorial-out group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {unavailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-navy/60">
              <span className="text-xs uppercase tracking-widest text-ivory">
                {product.status === "SOLD_OUT" ? "Currently Unavailable" : "Coming Soon"}
              </span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-start justify-between">
          <div>
            <p className="font-display text-lg text-charcoal">{product.name}</p>
            {product.archiveCode && (
              <p className="text-xs uppercase tracking-wide text-charcoal/50">{product.archiveCode}</p>
            )}
          </div>
          <p className="text-sm text-charcoal/70">
            from ₦{(product.basePrice / 100).toLocaleString()}
          </p>
        </div>
      </Link>
    </Reveal>
  );
}
