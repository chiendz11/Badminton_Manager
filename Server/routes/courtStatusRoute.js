import express from "express";
import { getBookingStatus } from "../controllers/courtStatusController.js";

const router = express.Router();

// Định nghĩa route GET /api/booking/status
router.get("/status", getBookingStatus);

export default router;
