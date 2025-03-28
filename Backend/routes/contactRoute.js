import express from "express";
import { createContactController } from "../controllers/contactController.js";

const router = express.Router();

// POST /api/contact - tạo mới thông tin liên hệ
router.post("/", createContactController);

export default router;
