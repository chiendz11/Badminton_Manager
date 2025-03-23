import express from "express";
import { getCourtStatusController, getTimeslotPriceController, getCourtsByCenterController, getCenterPricingController } from "../controllers/courtController.js";

const router = express.Router();

// Định tuyến API lấy danh sách sân
router.get("/status", getCourtStatusController);
router.post("/slotPrice", getTimeslotPriceController);
router.get("/getCourts", getCourtsByCenterController);
router.get("/pricing", getCenterPricingController);




export default router;
