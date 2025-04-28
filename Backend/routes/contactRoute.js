import express from "express";
import { createContactController } from "../controllers/contactController.js";
import { protect, restrictToClient } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/contact - tạo mới thông tin liên hệ
router.post("/", protect, restrictToClient, createContactController);

export default router;
