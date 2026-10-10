import { getAllCafeterias, getCafeteriaById, updateCafeteriaStatus } from "../models/Cafeteria.js";

export function getCafeterias(req, res) {
  const list = getAllCafeterias();
  return res.json(list);
}

export function getCafeteria(req, res) {
  const { id } = req.params;
  const caf = getCafeteriaById(id);
  if (!caf) return res.status(404).json({ message: "Cafeteria not found." });
  return res.json(caf);
}

export function updateStatus(req, res) {
  const { id } = req.params;
  const { isOpen, crowdLevel, queueMinutes } = req.body;
  const updated = updateCafeteriaStatus(id, { isOpen, crowdLevel, queueMinutes });
  if (!updated) return res.status(404).json({ message: "Cafeteria not found." });
  return res.json({ message: "Cafeteria status updated.", cafeteria: updated });
}
