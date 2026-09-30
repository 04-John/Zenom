"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type CartItem = {
  id: string; // local cart line id
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  sizeId?: string;
  sizeLabel?: string;
  backgroundTrackId?: string;
  backgroundTrackLabel?: string;
  quantity: number;
  notes?: string;
  unitPrice: number; // kobo
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

// Cart lives in memory/React state only — no localStorage in this
// preview environment. In production this should persist to
// localStorage (guarded with try/catch) and merge into the DB on login,
// per the "never lose cart data during auth" rule in the structural spec.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
