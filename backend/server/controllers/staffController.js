import {
  getStaffByCafeteria,
  createStaffMember,
  deleteStaffMember,
  getAllUsersAdmin,
  findUserByIdentifier,
} from "../models/User.js";

export function listStaff(req, res) {
  let { cafeteriaId } = req.query;

  // Strict Canteen Isolation: Manager or canteen admin can only list staff for their assigned cafeteria
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (cafeteriaId && cafeteriaId !== "all" && cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: You cannot view staff lists from other cafeterias (${cafeteriaId}).`,
      });
    }
    cafeteriaId = req.user.cafeteriaId;
  }

  const staff = getStaffByCafeteria(cafeteriaId);
  return res.json(staff);
}

export function addStaff(req, res) {
  const { fullName, identifier, email, cafeteriaId, staffRole, password } = req.body;
  if (!fullName || !identifier) {
    return res.status(400).json({ message: "Full Name and Staff ID are required." });
  }

  // Strict Canteen Isolation: Manager or canteen admin can only create staff for their own cafeteria
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (cafeteriaId && cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: You can only create staff accounts for your assigned cafeteria (${req.user.cafeteriaId}).`,
      });
    }
  }

  const effectiveCafeteriaId = (req.user?.cafeteriaId && req.user.cafeteriaId !== "all")
    ? req.user.cafeteriaId
    : (cafeteriaId || "vista");

  const newStaff = createStaffMember({
    fullName,
    identifier,
    email,
    cafeteriaId: effectiveCafeteriaId,
    staffRole: staffRole || "kitchen",
    password: password || "password123",
  });

  return res.status(201).json({
    message: `Staff member ${newStaff.fullName} (${newStaff.identifier}) created successfully.`,
    staff: newStaff,
  });
}

export function removeStaff(req, res) {
  const { identifier } = req.params;
  const targetStaff = findUserByIdentifier(identifier);
  if (!targetStaff) return res.status(404).json({ message: "Staff member not found." });

  // Strict Canteen Isolation: Cannot deactivate staff of another cafeteria
  if (req.user?.cafeteriaId && req.user.cafeteriaId !== "all") {
    if (targetStaff.cafeteriaId && targetStaff.cafeteriaId.toLowerCase() !== req.user.cafeteriaId.toLowerCase()) {
      return res.status(403).json({
        message: `Access denied. Privacy violation: You cannot deactivate staff members from other cafeterias (${targetStaff.cafeteriaId}).`,
      });
    }
  }

  const ok = deleteStaffMember(identifier);
  if (!ok) return res.status(404).json({ message: "Staff member not found." });
  return res.json({ message: `Staff member ${identifier} removed.` });
}

export function listAllUsers(req, res) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Administrator privileges required." });
  }

  const users = getAllUsersAdmin();
  // Canteen admin: only show university members and staff assigned to their own cafeteria
  if (req.user.cafeteriaId && req.user.cafeteriaId !== "all") {
    const filtered = users.filter((u) => !u.cafeteriaId || u.cafeteriaId === req.user.cafeteriaId);
    return res.json(filtered);
  }
  return res.json(users);
}
