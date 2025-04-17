// newsRoutes.js
import express from "express";
import {
  getAllNews,
  createNews,
  getNewsById,
  updateNews,
  deleteNews,
} from "./newsController.js";

const router = express.Router();

// Lấy danh sách tất cả tin tức
router.get("/", getAllNews);

// Tạo tin tức mới
router.post("/", createNews);

// Lấy chi tiết tin tức theo ID
router.get("/:id", getNewsById);

// Cập nhật tin tức theo ID
router.put("/:id", updateNews);

// Xoá tin tức theo ID
router.delete("/:id", deleteNews);

export default router;
