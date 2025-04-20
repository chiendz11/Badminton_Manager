// newsRoutes.js
import express from "express";
import {
  createNews,
  getNewsById,
  updateNews,
  deleteNews,
  getNewsController
} from "../controllers/newsController.js";

const router = express.Router();

router.get("/", getNewsController);

// Tạo tin tức mới
router.post("/", createNews);

// Lấy chi tiết tin tức theo ID
router.get("/:id", getNewsById);

// Cập nhật tin tức theo ID
router.put("/:id", updateNews);

// Xoá tin tức theo ID
router.delete("/:id", deleteNews);



export default router;
