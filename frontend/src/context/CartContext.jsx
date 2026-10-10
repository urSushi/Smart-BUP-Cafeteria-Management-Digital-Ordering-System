import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useToast } from "./ToastContext.jsx";
import { apiService } from "../services/apiService.js";

const CartContext = createContext(null);
const CART_STORAGE_KEY = "sbcms_cart_v1";

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { items: [], cafeteriaId: null, promo: null };
  } catch {
    return { items: [], cafeteriaId: null, promo: null };
  }
}

export function CartProvider({ children }) {
  const [cartState, setCartState] = useState(() => loadCart());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
    } catch {}
  }, [cartState]);

  const items = cartState.items || [];
  const cafeteriaId = cartState.cafeteriaId;
  const promo = cartState.promo;

  const itemsCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

  const discount = useMemo(() => {
    if (!promo || !promo.valid) return 0;
    return promo.discount || 0;
  }, [promo]);

  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  // Max prep time of items in cart
  const estimatedPrepTime = useMemo(() => {
    if (items.length === 0) return 0;
    const maxBase = Math.max(...items.map((i) => i.prepTimeMinutes || 6));
    return maxBase + (items.length > 2 ? 3 : 0);
  }, [items]);

  function addToCart(item, qty = 1, notes = "") {
    if (!item) return;

    // Check cafeteria match
    if (cafeteriaId && items.length > 0 && cafeteriaId !== item.cafeteriaId) {
      const confirmSwitch = window.confirm(
        `Your cart contains items from another cafeteria. Clear cart and start an order from ${item.cafeteriaName || item.cafeteriaId}?`
      );
      if (!confirmSwitch) return false;

      // Start fresh
      setCartState({
        cafeteriaId: item.cafeteriaId,
        promo: null,
        items: [{ ...item, qty, notes }],
      });
      toast.info(`Cart updated for ${item.cafeteriaName || item.cafeteriaId}.`);
      setIsCartOpen(true);
      return true;
    }

    setCartState((prev) => {
      const existingIdx = prev.items.findIndex((i) => i.id === item.id);
      let nextItems = [];
      if (existingIdx !== -1) {
        nextItems = prev.items.map((i, idx) =>
          idx === existingIdx ? { ...i, qty: i.qty + qty, notes: notes || i.notes } : i
        );
      } else {
        nextItems = [...prev.items, { ...item, qty, notes }];
      }

      return {
        ...prev,
        cafeteriaId: item.cafeteriaId,
        items: nextItems,
      };
    });

    toast.success(`Added ${qty}x ${item.name} to cart.`);
    setIsCartOpen(true);
    return true;
  }

  function updateQty(itemId, newQty) {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, qty: newQty } : i)),
    }));
  }

  function updateItemNotes(itemId, notes) {
    setCartState((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, notes } : i)),
    }));
  }

  function removeFromCart(itemId) {
    setCartState((prev) => {
      const nextItems = prev.items.filter((i) => i.id !== itemId);
      return {
        ...prev,
        cafeteriaId: nextItems.length === 0 ? null : prev.cafeteriaId,
        promo: nextItems.length === 0 ? null : prev.promo,
        items: nextItems,
      };
    });
  }

  function clearCart() {
    setCartState({ items: [], cafeteriaId: null, promo: null });
  }

  async function applyPromoCode(code) {
    if (!code || !code.trim()) return;
    try {
      const res = await apiService.validatePromotion(code.trim(), subtotal, cafeteriaId);
      if (res.valid) {
        setCartState((prev) => ({
          ...prev,
          promo: { code: code.toUpperCase().trim(), discount: res.discount, valid: true },
        }));
        toast.success(res.message);
      } else {
        toast.error(res.message || "Invalid coupon.");
      }
    } catch (err) {
      toast.error(err.message || "Could not validate coupon.");
    }
  }

  function removePromoCode() {
    setCartState((prev) => ({ ...prev, promo: null }));
    toast.info("Coupon removed.");
  }

  const value = {
    cartItems: items,
    cartCafeteria: cafeteriaId,
    itemsCount,
    subtotal,
    discount,
    total,
    promo,
    estimatedPrepTime,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateQty,
    updateItemNotes,
    removeFromCart,
    clearCart,
    applyPromoCode,
    removePromoCode,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
