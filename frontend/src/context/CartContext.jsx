import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";
import { apiService } from "../services/apiService.js";

const CartContext = createContext(null);

function getCartStorageKey(user) {
  if (!user) return "sbcms_cart_guest";
  const id = user.identifier || user.id || "anonymous";
  return `sbcms_cart_user_${id}`;
}

function loadCartForUser(user) {
  try {
    const key = getCartStorageKey(user);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { items: [], cafeteriaId: null, promo: null };
  } catch {
    return { items: [], cafeteriaId: null, promo: null };
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartState, setCartState] = useState(() => loadCartForUser(user));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const toast = useToast();

  const prevUserRef = useRef(user);
  const activeKeyRef = useRef(getCartStorageKey(user));

  // User lifecycle: migrate guest cart on login, wipe cart on logout or account switch
  useEffect(() => {
    const prevUser = prevUserRef.current;
    const prevKey = getCartStorageKey(prevUser);
    const currentKey = getCartStorageKey(user);

    if (prevKey !== currentKey) {
      prevUserRef.current = user;

      // 1. Guest -> Logged in user: Migrate guest cart items and show cart drawer
      if (!prevUser && user) {
        let guestCart = null;
        try {
          const raw = localStorage.getItem("sbcms_cart_guest");
          if (raw) guestCart = JSON.parse(raw);
        } catch {}

        // Fallback to in-memory cartState if localStorage was empty or already loaded
        if (!guestCart || !guestCart.items || guestCart.items.length === 0) {
          if (cartState && cartState.items && cartState.items.length > 0) {
            guestCart = cartState;
          }
        }

        if (guestCart && guestCart.items && guestCart.items.length > 0) {
          try {
            localStorage.setItem(currentKey, JSON.stringify(guestCart));
            localStorage.removeItem("sbcms_cart_guest");
          } catch {}
          activeKeyRef.current = currentKey;
          setCartState(guestCart);
          // Make sure cart drawer opens visibly upon login
          setIsCartOpen(true);
          toast.info("Your cart items are ready for checkout!");
          return;
        } else {
          activeKeyRef.current = currentKey;
          setCartState(loadCartForUser(user));
          return;
        }
      }

      // 2. Logged in user -> Logged out: Wipe cart completely and close drawer
      if (prevUser && !user) {
        const emptyCart = { items: [], cafeteriaId: null, promo: null };
        try {
          localStorage.removeItem(prevKey);
          localStorage.removeItem("sbcms_cart_guest");
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith("sbcms_cart_")) localStorage.removeItem(k);
          });
        } catch {}
        activeKeyRef.current = currentKey;
        setCartState(emptyCart);
        setIsCartOpen(false);
        return;
      }

      // 3. User A -> User B (Account switch): Wipe cart completely and close drawer
      if (prevUser && user && prevKey !== currentKey) {
        const emptyCart = { items: [], cafeteriaId: null, promo: null };
        try {
          localStorage.removeItem(prevKey);
          localStorage.removeItem(currentKey);
          localStorage.removeItem("sbcms_cart_guest");
        } catch {}
        activeKeyRef.current = currentKey;
        setCartState(emptyCart);
        setIsCartOpen(false);
        return;
      }

      activeKeyRef.current = currentKey;
    }
  }, [user]);

  // Persist cart to user's isolated storage key
  useEffect(() => {
    const currentKey = getCartStorageKey(user);
    if (activeKeyRef.current !== currentKey) return;

    try {
      if (!cartState.items || cartState.items.length === 0) {
        localStorage.removeItem(currentKey);
      } else {
        localStorage.setItem(currentKey, JSON.stringify(cartState));
      }
    } catch {}
  }, [cartState, user]);

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

    // 1. Stock check: Ensure item is available and has remaining stock
    if (item.stockQuantity !== undefined && item.stockQuantity <= 0) {
      toast.error(`"${item.name}" is sold out and cannot be added to cart.`);
      return false;
    }

    const existingItem = items.find((i) => i.id === item.id);
    const existingQty = existingItem ? existingItem.qty : 0;
    const maxStock = item.stockQuantity !== undefined ? item.stockQuantity : 99;

    if (existingQty + qty > maxStock) {
      toast.warning(
        `Cannot add ${qty} more. Only ${maxStock - existingQty} additional portion(s) available in kitchen stock.`
      );
      return false;
    }

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

    const targetItem = items.find((i) => i.id === itemId);
    const maxStock = targetItem && targetItem.stockQuantity !== undefined ? targetItem.stockQuantity : 99;

    if (newQty > maxStock) {
      toast.warning(`Maximum available stock for "${targetItem?.name}" is ${maxStock}.`);
      newQty = maxStock;
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
    try {
      const key = getCartStorageKey(user);
      localStorage.removeItem(key);
      localStorage.removeItem("sbcms_cart_guest");
    } catch {}
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
