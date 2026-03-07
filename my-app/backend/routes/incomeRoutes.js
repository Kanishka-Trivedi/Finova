import express from "express";
import {
    createIncome,
    getIncomes,
    deleteIncome,
    updateIncome,
} from "../controllers/incomeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createIncome);
router.get("/", protect, getIncomes);
router.delete("/:id", protect, deleteIncome);
router.patch("/:id", protect, updateIncome);

export default router;
