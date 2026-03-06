import express from "express";
import multer from "multer";
import {
    exportToExcel,
    exportToPDF,
    importFromExcel,
    clearAllData,
    getStats,
    updateBackupSettings,
    manualBackup,
    localJSONBackup
} from "../controllers/dataController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Storage Statistics and Settings
router.get("/stats", protect, getStats);
router.put("/backup-settings", protect, updateBackupSettings);

// Backups and Exports
router.post("/backup", protect, manualBackup);
router.get("/export/excel", protect, exportToExcel);
router.get("/export/pdf", protect, exportToPDF);
router.get("/backup/local", protect, localJSONBackup);

// Imports and Deletions
router.post("/import/excel", protect, upload.single("file"), importFromExcel);
router.post("/clear", protect, clearAllData);

export default router;
