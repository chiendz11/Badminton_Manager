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

const router = express.Router();

router.get("/", protect, restrictToAdmin, getNewsController);

// Tạo tin tức mới
router.post("/", protect, restrictToAdmin, createNews);

// Lấy chi tiết tin tức theo ID
router.get("/:id", protect, restrictToAdmin, getNewsById);

// Cập nhật tin tức theo ID
router.put("/:id", protect, restrictToAdmin, updateNews);

// Xoá tin tức theo ID
router.delete("/:id", protect, restrictToAdmin, deleteNews);



export default router;
