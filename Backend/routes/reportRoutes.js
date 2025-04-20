import express from "express";
import { getRevenueAndCost, getMonthlyReport } from "../controllers/reportController.js";
const router = express.Router();

router.get("/summary", getRevenueAndCost);
router.get("/monthly", getMonthlyReport); 

export default router;
