"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";

type Option = { id: string; label: string; priceModifier: number };

// Guided, progressive-disclosure customization: size -> background -> notes
// -> review. Never all fields dumped at once. Selected state uses a
// stronger border + check, never color alone.
export function ProductCustomizer({
  productId,
  productName,
  productSlug,
  imageUrl,
  basePrice,
  sizes,
  backgroundTracks,
  available,
}: {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  basePrice: number;
  sizes: Option[];
  backgroundTracks: Option[];
  available: boolean;
}) {
  const [step, setStep] = useState(1);
  const [size, setSize] = useState<Option | null>(null);
  const [track, setTrack] = useState<Option | null>(null);
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const unitPrice = basePrice + (size?.priceModifier ?? 0) + (track?.priceModifier ?? 0);

  function handleAddToOrder() {
    addItem({
      id: crypto.randomUUID(),
      productId,
      productName,
      productSlug,
      imageUrl,
      sizeId: size?.id,
      sizeLabel: size?.label,
      backgroundTrackId: track?.id,
      backgroundTrackLabel: track?.label,
      quantity: 1,
      notes: notes || undefined,
      unitPrice,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (!available) {
    return (
      <div className="rounded-card border border-charcoal/10 p-6">
        <p className="font-display text-xl text-navy">Currently Unavailable</p>
        <p className="mt-2 text-sm text-charcoal/70">
          This piece isn&rsquo;t open for commission right now — reach out on WhatsApp and we&rsquo;ll let you
          know if it becomes available again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StepBlock number={1} title="Choose your size" active={step >= 1}>
        <div className="grid grid-cols-3 gap-3">
          {sizes.map((s) => (
            <OptionPill key={s.id} option={s} selected={size?.id === s.id} onSelect={() => { setSize(s); setStep(2); }} />
          ))}
        </div>
      </StepBlock>

      {step >= 2 && (
        <StepBlock number={2} title="Choose background" active={step >= 2}>
          <div className="grid grid-cols-2 gap-3">
            {backgroundTracks.map((t) => (
              <OptionPill key={t.id} option={t} selected={track?.id === t.id} onSelect={() => { setTrack(t); setStep(3); }} />
            ))}
          </div>
        </StepBlock>
      )}

      {step >= 3 && (
        <StepBlock number={3} title="Notes (optional)" active={step >= 3}>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us anything you'd like us to know about your piece…"
            className="w-full rounded-btn border border-charcoal/20 p-3 text-sm focus:border-copper focus:outline-none"
            rows={3}
          />
        </StepBlock>
      )}

      <div className="flex items-center justify-between border-t border-charcoal/10 pt-6">
        <p className="font-display text-xl text-navy">₦{(unitPrice / 100).toLocaleString()}</p>
        <Button onClick={handleAddToOrder} disabled={!size || !track}>
          {added ? "Added ✓" : "Add to Order"}
        </Button>
      </div>
      <p className="text-xs text-charcoal/50">
        Final pricing will be confirmed with you on WhatsApp.
      </p>
    </div>
  );
}

function StepBlock({ number, title, active, children }: { number: number; title: string; active: boolean; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: active ? 1 : 0.4, y: 0 }} transition={{ duration: 0.3 }}>
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-navy">
        Step {number} — {title}
      </p>
      {children}
    </motion.div>
  );
}

function OptionPill({ option, selected, onSelect }: { option: Option; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`min-h-[44px] rounded-btn border px-4 py-3 text-sm transition-colors ${
        selected ? "border-copper bg-copper/10 font-medium text-navy" : "border-charcoal/20 text-charcoal/80 hover:border-charcoal/40"
      }`}
    >
      {selected && "✓ "}
      {option.label}
    </button>
  );
}
