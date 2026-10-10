// Same in-memory approach as User.js — see the note there about swapping
// in a real database later.

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

let guests = [];
let nextId = 1;

export function createGuest(data) {
  const guest = {
    id: nextId++,
    fullName: data.fullName,
    personalEmail: data.personalEmail,
    phone: data.phone,
    passwordHash: data.passwordHash,
    status: "pending_otp", // "pending_otp" | "active" | "expired"
    verified: false,
    createdAt: new Date().toISOString(),
    expiresAt: null, // set once verified/activated
  };
  guests.push(guest);
  return guest;
}

export function findGuestByEmail(email) {
  if (!email) return null;
  return guests.find((g) => g.personalEmail?.toLowerCase() === email.toLowerCase()) || null;
}

export function findGuestById(id) {
  return guests.find((g) => g.id === id) || null;
}

/** Marks a guest verified/active and starts the 7-day expiry window. */
export function activateGuest(id) {
  const guest = findGuestById(id);
  if (!guest) return null;
  const now = Date.now();
  guest.verified = true;
  guest.status = "active";
  guest.expiresAt = new Date(now + SEVEN_DAYS_MS).toISOString();
  return guest;
}

/** Returns true (and flips status) if this guest's 7-day window has passed. */
export function isGuestExpired(guest) {
  if (!guest || guest.status !== "active") return false;
  const expired = new Date(guest.expiresAt).getTime() < Date.now();
  if (expired) guest.status = "expired";
  return expired;
}

export function toPublicGuest(guest) {
  if (!guest) return null;
  const { passwordHash, ...safe } = guest;
  return safe;
}
