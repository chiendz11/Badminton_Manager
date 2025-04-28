import express from "express";
import * as controller from "../controllers/sellhistoryController.js";
import { protect, restrictToAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tất cả hóa đơn bán hàng
router.get("/", protect, restrictToAdmin, controller.getAll);

// Tạo hóa đơn mới
router.post("/", protect, restrictToAdmin, controller.create);

export default router;