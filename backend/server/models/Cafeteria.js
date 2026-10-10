// Cafeteria Model for Smart BUP Cafeteria Management System (SBCMS)
// Represents the 4 BUP campus cafeterias per proposal:
// 1. Vista Cafe (Academic Building Ground Floor)
// 2. Amitie Cafeteria (FBS Building Ground Floor)
// 3. Pitstop (FASS Building Ground Floor Walkway)
// 4. Third Place (Monpura Lakeside Deck)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { syncCafeteriaToDatabase } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSISTENT_FILE = path.resolve(__dirname, "../../database/persistent_cafeterias.json");

const DEFAULT_CAFETERIAS = [
  {
    id: "vista",
    name: "Vista Cafe",
    tagline: "Academic ground floor dining & continental delights",
    building: "Academic Building",
    floor: "Ground Floor",
    isOpen: true,
    openingHours: "8:00 AM – 6:30 PM",
    queueMinutes: 6,
    crowdLevel: "Moderate",
    rating: 4.8,
    reviewsCount: 342,
    cuisine: "Continental & Bengali Meals",
    pickupCounter: "Counter 2 (Express)",
    managerId: "MGR-001",
    manualOverrideClosed: false,
  },
  {
    id: "amitie",
    name: "Amitie Cafeteria",
    tagline: "Traditional Bengali meals & 'Daabing' fresh juice corner",
    building: "FBS Building",
    floor: "Ground Floor",
    isOpen: true,
    openingHours: "8:30 AM – 7:00 PM",
    queueMinutes: 12,
    crowdLevel: "Busy",
    rating: 4.9,
    reviewsCount: 512,
    cuisine: "Authentic Bengali, Polao & 'Daabing' Juices",
    pickupCounter: "Counter 1 (Biryani Express)",
    managerId: "MGR-002",
    manualOverrideClosed: false,
  },
  {
    id: "pitstop",
    name: "Pitstop",
    tagline: "Grab-and-go snacks, juices & quick breakfast",
    building: "FASS Building",
    floor: "Ground Floor Walkway",
    isOpen: true,
    openingHours: "8:00 AM – 5:30 PM",
    queueMinutes: 3,
    crowdLevel: "Fast",
    rating: 4.7,
    reviewsCount: 228,
    cuisine: "Fast Food, Bakery & Espresso",
    pickupCounter: "Window 1 (Quick Grab)",
    managerId: "MGR-001",
    manualOverrideClosed: false,
  },
  {
    id: "monpura",
    name: "Third Place",
    tagline: "Lakeside dining, traditional Bengali breakfast/lunch & evening snacks",
    building: "Monpura Lakeside",
    floor: "Lakeside Deck",
    isOpen: true,
    openingHours: "8:00 AM – 9:30 PM",
    queueMinutes: 6,
    crowdLevel: "Moderate",
    rating: 4.9,
    reviewsCount: 418,
    cuisine: "Bengali Meals, Fast Food, Snacks & Ice Cream",
    pickupCounter: "Lakeside Deck Counter",
    managerId: "MGR-THP",
    manualOverrideClosed: false,
  },
];

function loadPersistentCafeterias() {
  try {
    if (fs.existsSync(PERSISTENT_FILE)) {
      const raw = fs.readFileSync(PERSISTENT_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to ensure all fields are present
        const merged = DEFAULT_CAFETERIAS.map((def) => {
          const found = parsed.find((p) => p.id?.toLowerCase() === def.id.toLowerCase());
          return found ? { ...def, ...found } : def;
        });
        return merged;
      }
    }
  } catch (err) {
    console.warn("[Cafeteria DB] Warning reading persistent_cafeterias.json:", err.message);
  }
  savePersistentCafeteriasToFile(DEFAULT_CAFETERIAS);
  return [...DEFAULT_CAFETERIAS];
}

function savePersistentCafeteriasToFile(list) {
  try {
    fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Cafeteria DB] Warning saving persistent_cafeterias.json:", err.message);
  }
}

let cafeterias = loadPersistentCafeterias();

export function getAllCafeterias() {
  return cafeterias;
}

export function getCafeteriaById(id) {
  if (!id) return null;
  return cafeterias.find((c) => c.id.toLowerCase() === id.toLowerCase()) || null;
}

export function updateCafeteriaStatus(id, { isOpen, crowdLevel, queueMinutes }) {
  const caf = getCafeteriaById(id);
  if (!caf) return null;
  if (isOpen !== undefined) {
    caf.isOpen = Boolean(isOpen);
    caf.manualOverrideClosed = !isOpen;
  }
  if (crowdLevel !== undefined) caf.crowdLevel = crowdLevel;
  if (queueMinutes !== undefined) caf.queueMinutes = Number(queueMinutes);

  savePersistentCafeteriasToFile(cafeterias);
  syncCafeteriaToDatabase(caf);
  return caf;
}
