import express from "express";
import * as controller from "../controllers/sellhistoryController.js";
import { protect, restrictToAdmin } from "../middleware/authMiddleware.js";
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

// Tất cả hóa đơn bán hàng
router.get("/", protect, restrictToAdmin, controller.getAll);

// Tạo hóa đơn mới
router.post("/", protect, restrictToAdmin, csrfProtection, controller.create);

export default router;