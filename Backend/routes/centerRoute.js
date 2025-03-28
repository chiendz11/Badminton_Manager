import express from "express";
import { getCourtStatusController, getTimeslotPriceController, getCourtsByCenterController, getCenterPricingByIdController, getCenterInfoByIdController, getAllCentersController} from "../controllers/centerController.js";

const router = express.Router();

// Định tuyến API lấy danh sách sân
router.get("/status", getCourtStatusController);
router.post("/slotPrice", getTimeslotPriceController);
router.get("/getCourts", getCourtsByCenterController);
router.get("/pricing", getCenterPricingByIdController);
router.get("/getAllCenters", getAllCentersController);
router.get("/infoing", getCenterInfoByIdController);



export default router;
