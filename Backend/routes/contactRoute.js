import express from "express";
import { createContactController } from "../controllers/contactController.js";
import { protect, restrictToClient } from "../middleware/authMiddleware.js";
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

// POST /api/contact - tạo mới thông tin liên hệ
router.post("/", protect, restrictToClient, csrfProtection, createContactController);

export default router;
