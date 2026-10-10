/**
 * Use after requireAuth: requireRole("admin"), requireRole("cafeteria_staff", "cafeteria_manager"), etc.
 * Kept generic so future modules (ordering, menu management, analytics) can
 * reuse it without adding new middleware per role.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You don't have permission to do that." });
    }
    next();
  };
}
