import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getArtworkBySlug, getArtworks } from "@/lib/artworks";
import { ART_GROUPS } from "@/lib/catalog";
import { CATEGORY_LABEL, DEFAULT_SIZE_INDEX, artworkPrice, isPortrait } from "@/lib/pricing";
import { Reveal } from "@/components/motion/Reveal";
import { ArtworkIntro } from "./ArtworkIntro";
import { ProductCustomizer } from "./ProductCustomizer";

type Section = "portraits" | "abstract";

// Slugs are global. A portrait opened under /abstract (or the reverse) is sent
// to its real route; unknown slugs 404.
async function load(slug: string, section: Section) {
  const found = await getArtworkBySlug(slug);
  if (!found) notFound();
  const portrait = isPortrait(found.card.category);
  if (portrait !== (section === "portraits")) redirect(found.card.href);
  return found;
}

export async function artworkMetadata(slug: string): Promise<Metadata> {
  const found = await getArtworkBySlug(slug);
  if (!found) return {};
  const { card } = found;
  return {
    title: `${card.name} | Zenom Studio`,
    description: card.description,
    openGraph: { title: card.name, description: card.description, images: [card.imageUrl] },
  };
}

export async function ArtworkDetail({ slug, section }: { slug: string; section: Section }) {
  const { card, row } = await load(slug, section);
  const group = ART_GROUPS.find((g) => g.category === card.category);
  const categoryLabel = (group?.label ?? CATEGORY_LABEL[card.category]).toUpperCase();

  const related = (await getArtworks([card.category])).filter((a) => a.id !== card.id).slice(0, 4);
  const price = artworkPrice(card.category, DEFAULT_SIZE_INDEX);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: card.name,
            description: card.description,
            image: card.imageUrl,
            offers: {
              "@type": "Offer",
              priceCurrency: "NGN",
              price: (price / 100).toFixed(2),
              availability: row.status === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />

      <ArtworkIntro
        name={card.name}
        imageUrl={card.imageUrl}
        width={card.width}
        height={card.height}
        kicker={`${categoryLabel} · ${card.code}`}
        medium={group?.medium ?? ""}
      />

      <div className="relative z-[2] mx-auto max-w-[1360px] px-6 pb-[180px] pt-[60px]">
        <Link
          href={section === "portraits" ? "/portraits" : `/abstract?style=${card.category}`}
          className="mb-7 inline-block font-mono text-[11px] tracking-[0.2em] text-ink-2 hover:text-ink"
        >
          ← BACK TO {categoryLabel}
        </Link>

        <ProductCustomizer
          art={{
            id: card.id,
            slug: card.slug,
            name: card.name,
            code: card.code,
            description: card.description,
            category: card.category,
            imageUrl: card.imageUrl,
            width: card.width,
            height: card.height,
            available: row.status === "AVAILABLE",
          }}
          categoryLabel={categoryLabel}
        />

        {related.length > 0 && (
          <div className="mt-[120px]">
            <Reveal className="mb-6 font-mono text-[11px] uppercase tracking-[0.28em] text-ember">
              MORE IN {categoryLabel}
            </Reveal>
            <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
              {related.map((a) => (
                <Reveal key={a.id} variant="toss">
                  <Link
                    href={a.href}
                    data-cursor="View"
                    data-transition-label={a.name}
                    className="group block text-ink hover:text-ink"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] transition-transform duration-[400ms] group-hover:-translate-y-1">
                      <Image
                        src={a.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 600px) 50vw, 240px"
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2.5 font-display text-[22px] italic">{a.name}</div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
