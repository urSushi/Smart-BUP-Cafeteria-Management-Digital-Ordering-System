// Smart BUP Cafeteria Management System (SBCMS) — Canteen Privacy & Isolation Middleware
// Enforces strict operational isolation so canteen managers and staff can only access and
// manipulate data for their assigned cafeteria (user.cafeteriaId).

/**
 * Middleware that checks if the authenticated user has permission to access the target cafeteria.
 * - Master Admin (`role === 'admin'` and `(cafeteriaId === 'all' || !cafeteriaId)`): Campus-wide governance.
 * - Canteen Admin (`role === 'admin'` and `cafeteriaId !== 'all'`): Strictly locked to `cafeteriaId`.
 * - Canteen Manager (`role === 'cafeteria_manager'`): Strictly locked to `cafeteriaId`.
 * - Canteen Staff (`role === 'cafeteria_staff'`): Strictly locked to `cafeteriaId`.
 *
 * @param {string} key - property name holding target cafeteriaId (default: 'cafeteriaId')
 * @param {string} source - 'params' | 'query' | 'body' (default: 'params')
 */
export function requireCafeteriaAccess(key = "cafeteriaId", source = "params") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { role, cafeteriaId: userCafeteriaId } = req.user;

    // Master System Admin has campus-wide governance across all canteens
    if (role === "admin" && (userCafeteriaId === "all" || !userCafeteriaId)) {
      return next();
    }

    // Extract target cafeteria ID
    let targetCafeteriaId = null;
    if (source === "params") targetCafeteriaId = req.params[key];
    else if (source === "query") targetCafeteriaId = req.query[key];
    else if (source === "body") targetCafeteriaId = req.body[key];

    // If query/body omitted cafeteriaId, auto-scope to the user's assigned cafeteria
    if (!targetCafeteriaId) {
      if (source === "query") req.query[key] = userCafeteriaId;
      else if (source === "body") req.body[key] = userCafeteriaId;
      return next();
    }

    // Verify isolation: must match assigned cafeteria exactly
    if (
      !userCafeteriaId ||
      userCafeteriaId.toLowerCase() !== String(targetCafeteriaId).toLowerCase()
    ) {
      return res.status(403).json({
        message: `Access denied. Privacy policy violation: You are restricted to your assigned canteen (${userCafeteriaId || "unknown"}) and cannot access or manipulate data for "${targetCafeteriaId}".`,
      });
    }

    next();
  };
}

/**
 * Helper function to verify if an authenticated user is permitted to interact with a specific canteen.
 * Returns true if permitted, false otherwise.
 */
export function canUserAccessCafeteria(user, targetCafeteriaId) {
  if (!user) return false;
  if (user.role === "admin" && (user.cafeteriaId === "all" || !user.cafeteriaId)) {
    return true;
  }
  if (!user.cafeteriaId || !targetCafeteriaId) return false;
  return user.cafeteriaId.toLowerCase() === String(targetCafeteriaId).toLowerCase();
}
