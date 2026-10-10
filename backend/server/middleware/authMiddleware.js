import jwt from "jsonwebtoken";
import { findUserById, toPublicUser } from "../models/User.js";
import { findGuestById, isGuestExpired, toPublicGuest } from "../models/Guest.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role === "guest") {
      const guest = findGuestById(payload.id);
      if (!guest) {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
      if (isGuestExpired(guest)) {
        return res.status(403).json({ message: "Your guest account has expired. Please register again." });
      }
      req.user = { ...toPublicGuest(guest), role: "guest" };
      return next();
    }

    const user = findUserById(payload.id);
    if (!user) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    req.user = toPublicUser(user);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}
