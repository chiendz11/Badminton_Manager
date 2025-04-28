import express from "express";
import { getCourtStatusController, getTimeslotPriceController, getCourtsByCenterController, getCenterPricingByIdController, getCenterInfoByIdController, getAllCentersController} from "../controllers/centerController.js";
import { protect, restrictToClient } from "../middleware/authMiddleware.js";

const router = express.Router();

// Định tuyến API lấy danh sách sân
router.get("/status", protect, restrictToClient, getCourtStatusController);
router.post("/slotPrice", protect, restrictToClient, getTimeslotPriceController);
router.get("/getCourts", protect, restrictToClient, getCourtsByCenterController);
router.get("/pricing", protect, restrictToClient, getCenterPricingByIdController);
router.get("/getAllCenters", protect, restrictToClient, getAllCentersController);
router.get("/infoing", protect, restrictToClient, getCenterInfoByIdController);



export default router;
