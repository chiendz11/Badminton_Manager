import express from "express";
import { protect, restrictToAdmin } from "../middleware/authMiddleware.js";
import {
    getAllCentersController,
    getCourtsByCenterController,
    getFullMappingController,
} from "../controllers/centerStatusController.js";

const router = express.Router();

router.get(
    "/full-mapping",
    protect,
    restrictToAdmin,
    getFullMappingController
);

router.get(
    "/get-all-centers",
    protect,
    restrictToAdmin,
    getAllCentersController
);

router.get(
    "/get-courts",
    protect,
    restrictToAdmin,
    getCourtsByCenterController
);
export default router;