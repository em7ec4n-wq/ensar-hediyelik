"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/types/store";

const CART_STORAGE_KEY = "ensar_hediyelik_cart_v1";

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, selectedOption: string | undefined, quantity: number) => void;
  removeItem: (productId: string, selectedOption: string | undefined) => void;
  replaceItems: (nextItems: CartItem[]) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const addItem = useCallback((incoming: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.productId === incoming.productId &&
          (i.selectedOption || "") === (incoming.selectedOption || "")
      );
      if (idx === -1) {
        return [...prev, incoming];
      }
      const next = [...prev];
      const existing = next[idx];
      const clampedQty = Math.min(
        incoming.stock,
        existing.quantity + incoming.quantity
      );
      next[idx] = {
        ...existing,
        unitPrice: incoming.unitPrice,
        stock: incoming.stock,
        quantity: Math.max(1, clampedQty),
      };
      return next;
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, selectedOption: string | undefined, quantity: number) => {
      setItems((prev) => {
        if (quantity <= 0) {
          return prev.filter(
            (i) =>
              !(
                i.productId === productId &&
                (i.selectedOption || "") === (selectedOption || "")
              )
          );
        }
        return prev.map((i) => {
          if (
            i.productId === productId &&
            (i.selectedOption || "") === (selectedOption || "")
          ) {
            return {
              ...i,
              quantity: Math.min(Math.max(1, Math.floor(quantity)), Math.max(1, i.stock)),
            };
          }
          return i;
        });
      });
    },
    []
  );

  const removeItem = useCallback(
    (productId: string, selectedOption: string | undefined) => {
      setItems((prev) =>
        prev.filter(
          (i) =>
            !(
              i.productId === productId &&
              (i.selectedOption || "") === (selectedOption || "")
            )
        )
      );
    },
    []
  );

  const replaceItems = useCallback((nextItems: CartItem[]) => {
    setItems(nextItems);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        subtotal,
        hydrated,
        addItem,
        updateQuantity,
        removeItem,
        replaceItems,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
