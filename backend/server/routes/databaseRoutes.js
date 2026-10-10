import express from "express";
import db, { TABLE_SCHEMAS } from "../db.js";

const router = express.Router();

// GET /api/database/status
router.get("/status", (req, res) => {
  try {
    const status = db.getSystemStatus();
    return res.json(status);
  } catch (err) {
    return res.status(500).json({ message: "Failed to retrieve database status", error: err.message });
  }
});

// GET /api/database/schema
router.get("/schema", (req, res) => {
  try {
    return res.json({
      totalTables: Object.keys(TABLE_SCHEMAS).length,
      schemas: TABLE_SCHEMAS,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to retrieve schema definitions", error: err.message });
  }
});

// GET /api/database/tables/:table
router.get("/tables/:table", async (req, res) => {
  try {
    const { table } = req.params;
    const schema = db.getTableSchema(table);
    if (!schema) {
      return res.status(404).json({ message: `Table '${table}' not found in ER diagram schema.` });
    }

    const data = await db.getTableData(table);
    return res.json({
      table,
      schema,
      rowCount: data ? data.length : 0,
      rows: data || [],
    });
  } catch (err) {
    return res.status(500).json({ message: `Failed to retrieve records for table ${req.params.table}`, error: err.message });
  }
});

// GET /api/database/sql/:file (schema or seeds)
router.get("/sql/:file", (req, res) => {
  try {
    const { file } = req.params;
    if (file === "schema" || file === "schema.sql") {
      res.setHeader("Content-Type", "text/plain");
      return res.send(db.getSchemaSQL());
    } else if (file === "seeds" || file === "seeds.sql") {
      res.setHeader("Content-Type", "text/plain");
      return res.send(db.getSeedsSQL());
    }
    return res.status(404).json({ message: "Requested SQL script not found. Valid options: 'schema', 'seeds'" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to read SQL script", error: err.message });
  }
});

export default router;
