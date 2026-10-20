"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export type PortfolioPiece = {
  id: string;
  slug: string;
  title: string;
  category: string;
  imageUrl: string;
  width: number;
  height: number;
};

// Category filter pills + lightbox, backed entirely by real, published
// products — no fabricated images. If the catalog is empty for a category,
// that's just what the grid shows: an honest gap, never a stand-in photo.
export function PortfolioGallery({ pieces, categories }: { pieces: PortfolioPiece[]; categories: string[] }) {
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState<PortfolioPiece | null>(null);

  const allCategories = ["All", ...categories];

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2.5">
        {allCategories.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              data-cursor="Filter"
              className={`min-h-[44px] rounded-pill border px-5 py-2.5 text-[13px] font-semibold transition-colors ${
                isActive
                  ? "border-ink bg-ink text-night"
                  : "border-ink/15 bg-transparent text-ink-2 hover:border-ink/40 hover:text-ink"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {pieces.length === 0 ? (
        <p className="mt-16 text-center text-sm text-ink-2">
          No pieces published here yet. Check back soon, or explore the{" "}
          <Link href="/portraits" className="text-ember underline">
            available collection
          </Link>
          .
        </p>
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-4 text-left lg:grid-cols-4 lg:gap-6">
          {pieces.map((piece) => {
            const dim = active !== "All" && piece.category !== active;
            return (
              <button
                key={piece.id}
                onClick={() => setSelected(piece)}
                data-cursor="View"
                className="flex flex-col overflow-hidden rounded-tile border border-ink/10 bg-night-raised text-left shadow-art transition-all duration-300 ease-editorial-out hover:-translate-y-1.5"
                style={{ opacity: dim ? 0.25 : 1, transform: dim ? "scale(0.97)" : undefined }}
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={piece.imageUrl}
                    alt={piece.title}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                  />
                </div>
                <div className="px-4 pb-4 pt-3">
                  <p className="font-display text-xl italic text-ink">{piece.title}</p>
                  <p className="label-mono mt-1">{piece.category}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-night-deep/80 p-4 backdrop-blur-sm sm:p-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-card border border-ink/10 bg-night-raised shadow-hero"
            >
              <div className="relative h-80 w-full">
                <Image src={selected.imageUrl} alt={selected.title} fill className="object-cover" sizes="480px" />
              </div>
              <div className="flex items-start justify-between p-7">
                <div>
                  <p className="font-display text-3xl italic text-ink">{selected.title}</p>
                  <p className="label-mono mt-2">{selected.category}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  data-cursor="Close"
                  className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-pill border border-ink/15 bg-night-hover text-ink transition-colors hover:border-ink/40"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
