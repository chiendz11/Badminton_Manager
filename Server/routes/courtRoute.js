import express from "express";
import { getCourtsByCenterId } from "../controllers/courtController.js";

const router = express.Router();

// Định tuyến API lấy danh sách sân
router.get("/:centerId", getCourtsByCenterId);

export default router;
