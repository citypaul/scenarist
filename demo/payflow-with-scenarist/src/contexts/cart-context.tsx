"use client";

import * as React from "react";
import { useAuth, type UserTier } from "./auth-context";

export interface CartItem {
  id: string;
  name: string;
  basePrice: number;
  quantity: number;
}

interface CartContextValue {
  items: readonly CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discount: number;
  discountAmount: number;
  tax: number;
  total: number;
}

const CartContext = React.createContext<CartContextValue | undefined>(
  undefined,
);

// Tier discount percentages
const TIER_DISCOUNTS: Record<UserTier, number> = {
  free: 0,
  basic: 10,
  pro: 20,
  enterprise: 30,
};

const TAX_RATE = 0.1; // 10% tax

const CART_STORAGE_KEY = "payflow-cart";

function loadCartFromStorage(): readonly CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: readonly CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<readonly CartItem[]>([]);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const { user } = useAuth();
  const userTier = user?.tier ?? "free";
  const discount = TIER_DISCOUNTS[userTier];

  // Load cart from storage on mount (client-side only)
  React.useEffect(() => {
    setItems(loadCartFromStorage());
    setIsHydrated(true);
  }, []);

  // Persist cart to storage whenever it changes (after hydration)
  React.useEffect(() => {
    if (isHydrated) {
      saveCartToStorage(items);
    }
  }, [items, isHydrated]);

  const addItem = React.useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((i) => i.id === item.id);
      if (existingItem) {
        return currentItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...currentItems, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = React.useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((currentItems) => currentItems.filter((i) => i.id !== id));
    } else {
      setItems((currentItems) =>
        currentItems.map((i) => (i.id === id ? { ...i, quantity } : i)),
      );
    }
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = items.reduce(
    (acc, item) => acc + item.basePrice * item.quantity,
    0,
  );

  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + tax;

  const value = React.useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      discount,
      discountAmount,
      tax,
      total,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      discount,
      discountAmount,
      tax,
      total,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
