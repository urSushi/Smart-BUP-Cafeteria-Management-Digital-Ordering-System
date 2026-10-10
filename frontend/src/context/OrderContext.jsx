import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";
import { apiService } from "../services/apiService.js";
import { subscribeSync } from "../utils/liveCafeterias.js";

const OrderContext = createContext(null);

// Pleasant notification sound synthesizer using browser Web Audio API
function playReadyChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    // Note 1 (E5 - 659 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Note 2 (B5 - 987 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.15);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.8);
  } catch {}
}

export function OrderProvider({ children }) {
  const { user, authenticated } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const prevStatusesRef = useRef({});

  const refreshOrders = useCallback(async () => {
    if (!authenticated) return;
    try {
      const list = await apiService.getMyOrders(user?.id || 1);
      if (Array.isArray(list)) {
        // Detect status changes to "ready"
        list.forEach((ord) => {
          const prev = prevStatusesRef.current[ord.id];
          if (prev && prev !== "ready" && ord.orderStatus === "ready") {
            playReadyChime();
            toast.success(
              `🔔 Order #${ord.tokenNumber} is READY! Please collect it at ${ord.pickupCounter}.`
            );
          }
          prevStatusesRef.current[ord.id] = ord.orderStatus;
        });

        setOrders(list);

        // Update tracking order if currently open
        if (trackingOrder) {
          const updated = list.find((o) => o.id === trackingOrder.id);
          if (updated) setTrackingOrder(updated);
        }
      }
    } catch (err) {
      console.warn("Orders fetch poll:", err.message);
    }
  }, [authenticated, user, toast, trackingOrder]);

  // Initial fetch, live event listener, and polling loop
  useEffect(() => {
    if (!authenticated) {
      setOrders([]);
      return;
    }
    refreshOrders();
    const unsubscribe = subscribeSync(refreshOrders);
    const interval = setInterval(refreshOrders, 5000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [authenticated, refreshOrders]);

  const activeOrders = orders.filter((o) => ["placed", "preparing", "ready"].includes(o.orderStatus));
  const pastOrders = orders.filter((o) => !["placed", "preparing", "ready"].includes(o.orderStatus));

  async function cancelUserOrder(orderId, reason = "Cancelled by student") {
    setLoading(true);
    try {
      const res = await apiService.cancelOrder(orderId, reason);
      toast.success(res.message);
      await refreshOrders();
      return res;
    } catch (err) {
      toast.error(err.message || "Failed to cancel order.");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  const value = {
    orders,
    activeOrders,
    pastOrders,
    loading,
    refreshOrders,
    cancelUserOrder,
    trackingOrder,
    setTrackingOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within an OrderProvider");
  return ctx;
}
