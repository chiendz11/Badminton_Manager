import express from "express";
import { getRevenueAndCost, getMonthlyReport } from "../controllers/reportController.js";
import { protect, restrictToAdmin } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/summary", protect, restrictToAdmin, getRevenueAndCost);
router.get("/monthly", protect, restrictToAdmin, getMonthlyReport); 

export default router;
