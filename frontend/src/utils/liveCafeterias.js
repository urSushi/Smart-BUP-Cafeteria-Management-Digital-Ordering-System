import { useState, useEffect, useCallback } from "react";
import vistaImg from "../assets/cafeterias/vista.jpg";
import amitieImg from "../assets/cafeterias/amitie.jpg";
import monpuraImg from "../assets/cafeterias/monpura.jpg";
import pitstopImg from "../assets/cafeterias/pitstop.jpg";
import { CAFETERIAS } from "../data/cafeterias.js";
import { apiService } from "../services/apiService.js";

export const IMAGE_MAP = {
  vista: vistaImg,
  amitie: amitieImg,
  monpura: monpuraImg,
  pitstop: pitstopImg,
};

/**
 * Hydrate API cafeteria responses with bundled images, rich popular items, and default properties
 */
export function hydrateCafeterias(apiList) {
  if (!Array.isArray(apiList) || apiList.length === 0) {
    return CAFETERIAS;
  }

  return apiList.map((apiCaf) => {
    const idKey = apiCaf.id?.toLowerCase() || "";
    const fallback = CAFETERIAS.find((c) => c.id.toLowerCase() === idKey);

    return {
      ...(fallback || {}),
      ...apiCaf,
      image: IMAGE_MAP[idKey] || fallback?.image || vistaImg,
      isOpen: Boolean(apiCaf.isOpen),
      queueMinutes: Number(apiCaf.queueMinutes) || fallback?.queueMinutes || 5,
      crowdLevel: apiCaf.crowdLevel || fallback?.crowdLevel || "Moderate",
      popularItems: fallback?.popularItems || [],
      rating: apiCaf.rating ?? fallback?.rating ?? 4.8,
      reviewsCount: apiCaf.reviewsCount ?? fallback?.reviewsCount ?? 300,
      openingHours: apiCaf.openingHours || fallback?.openingHours || "8:00 AM – 8:00 PM",
      pickupCounter: apiCaf.pickupCounter || fallback?.pickupCounter || "Counter 1",
    };
  });
}

/**
 * Fetch live cafeterias from backend and hydrate
 */
export async function fetchLiveCafeterias() {
  try {
    const data = await apiService.getCafeterias();
    if (Array.isArray(data) && data.length > 0) {
      return hydrateCafeterias(data);
    }
  } catch (err) {
    console.warn("[liveCafeterias] Falling back to default list:", err.message);
  }
  return CAFETERIAS;
}

/**
 * Broadcast synchronization event across tabs, windows, and components
 */
export function broadcastSync(type = "DATA_UPDATED", payload = {}) {
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("sbcms_sync");
      channel.postMessage({ type, payload, timestamp: Date.now() });
      channel.close();
    }
  } catch {}

  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sbcms_sync", { detail: { type, payload } }));
      localStorage.setItem("sbcms_sync_heartbeat", Date.now().toString());
    }
  } catch {}
}

/**
 * Subscribe to sync events (BroadcastChannel, storage event, window focus, custom event)
 */
export function subscribeSync(callback) {
  if (typeof window === "undefined") return () => {};

  let channel = null;
  try {
    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel("sbcms_sync");
      channel.onmessage = () => {
        callback();
      };
    }
  } catch {}

  const handleCustom = () => callback();
  const handleStorage = (e) => {
    if (e.key === "sbcms_sync_heartbeat") {
      callback();
    }
  };
  const handleFocus = () => callback();

  window.addEventListener("sbcms_sync", handleCustom);
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", handleFocus);

  return () => {
    if (channel) {
      try {
        channel.close();
      } catch {}
    }
    window.removeEventListener("sbcms_sync", handleCustom);
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", handleFocus);
  };
}

/**
 * React hook to maintain live-connected cafeteria list with instant sync & polling
 */
export function useLiveCafeterias(pollIntervalMs = 4000) {
  const [cafeterias, setCafeterias] = useState(CAFETERIAS);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const live = await fetchLiveCafeterias();
    setCafeterias(live);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();

    const unsubscribe = subscribeSync(reload);

    let interval = null;
    if (pollIntervalMs > 0) {
      interval = setInterval(reload, pollIntervalMs);
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [reload, pollIntervalMs]);

  return { cafeterias, loading, refetch: reload };
}
