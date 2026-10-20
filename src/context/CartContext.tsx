"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  CATEGORIES,
  MAX_SUBJECTS,
  SIZES,
  orderTotals,
  unitPriceFor,
  type Category,
  type DeliveryZone,
} from "@/lib/pricing";

export type CartItem = {
  id: string; // local cart line id
  productId: string;
  productName: string;
  productSlug: string;
  archiveCode?: string;
  imageUrl: string;
  category: Category;
  sizeIndex: number;
  framed: boolean;
  subjectCount: number;
  notes?: string;
  unitPrice: number; // kobo — display snapshot; the server recomputes it
};

type CartContextValue = {
  items: CartItem[];
  delivery: DeliveryZone;
  setDelivery: (d: DeliveryZone) => void;
  addItem: (item: Omit<CartItem, "id" | "unitPrice">) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  totals: { subtotal: number; delivery: number; total: number; deposit: number };
  // false until the persisted cart has been read, so pages can avoid
  // flashing an "empty bag" before hydration.
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

// Bumped from any earlier key so carts saved in the old shape (size ids,
// background tracks, quantity) are dropped, not misread.
const STORAGE_KEY = "zenom.cart.v2";
const LEGACY_KEYS = ["zenom.cart", "zenom.cart.v1", "zenom.site.v1"];

function isValidItem(i: any): i is CartItem {
  return (
    i &&
    typeof i.id === "string" &&
    typeof i.productId === "string" &&
    typeof i.productName === "string" &&
    typeof i.productSlug === "string" &&
    typeof i.imageUrl === "string" &&
    CATEGORIES.includes(i.category) &&
    Number.isInteger(i.sizeIndex) &&
    i.sizeIndex >= 0 &&
    i.sizeIndex < SIZES.length &&
    typeof i.framed === "boolean" &&
    Number.isInteger(i.subjectCount) &&
    i.subjectCount >= 1 &&
    i.subjectCount <= MAX_SUBJECTS &&
    typeof i.unitPrice === "number"
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [delivery, setDelivery] = useState<DeliveryZone>("kaduna");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.items)) setItems(saved.items.filter(isValidItem));
        if (saved.delivery === "kaduna" || saved.delivery === "other") setDelivery(saved.delivery);
      }
    } catch {
      /* storage unavailable or corrupt — start with an empty bag */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, delivery }));
    } catch {
      /* ignore */
    }
  }, [items, delivery, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id" | "unitPrice">) => {
    const subjectCount = item.category === "portrait" ? item.subjectCount : 1;
    const full = { ...item, subjectCount };
    setItems((prev) => [...prev, { ...full, id: crypto.randomUUID(), unitPrice: unitPriceFor(full) }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(() => orderTotals(items, delivery), [items, delivery]);

  return (
    <CartContext.Provider value={{ items, delivery, setDelivery, addItem, removeItem, clear, totals, hydrated }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
