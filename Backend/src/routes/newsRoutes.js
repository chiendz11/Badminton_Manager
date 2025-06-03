// newsRoutes.js
import express from "express";
import {
  createNews,
  getNewsById,
  updateNews,
  deleteNews,
  getNewsController
} from "../controllers/newsController.js";
import { protect, restrictToAdmin } from "../middleware/authMiddleware.js";
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

router.get("/", protect, restrictToAdmin, getNewsController);

// Tạo tin tức mới
router.post("/", protect, restrictToAdmin, csrfProtection, createNews);

// Lấy chi tiết tin tức theo ID
router.get("/:id", protect, restrictToAdmin, getNewsById);

// Cập nhật tin tức theo ID
router.put("/:id", protect, restrictToAdmin, csrfProtection, updateNews);

// Xoá tin tức theo ID
router.delete("/:id", protect, restrictToAdmin, csrfProtection, deleteNews);



export default router;
