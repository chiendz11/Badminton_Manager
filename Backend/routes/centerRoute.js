import express from "express";
import { getCourtStatusController, getTimeslotPriceController, getCourtsByCenterController, getCenterPricingByIdController, getCenterInfoByIdController, getAllCentersController} from "../controllers/centerController.js";
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

// Định tuyến API lấy danh sách sân
router.get("/status", getCourtStatusController);
router.post("/slotPrice", csrfProtection, getTimeslotPriceController);
router.get("/getCourts", getCourtsByCenterController);
router.get("/pricing", getCenterPricingByIdController);
router.get("/getAllCenters", getAllCentersController);
router.get("/infoing", getCenterInfoByIdController);



export default router;
