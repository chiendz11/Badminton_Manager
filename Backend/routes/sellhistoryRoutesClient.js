import express from "express";
import * as controller from "../controllers/sellhistoryController.js";
import { protect, restrictToClient } from "../middleware/authMiddleware.js";
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

// Tạo hóa đơn mới
router.post("/", protect, restrictToClient, csrfProtection, controller.create);

export default router;