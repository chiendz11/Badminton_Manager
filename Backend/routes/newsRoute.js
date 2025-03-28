import express from "express";
import { getNewsController } from "../controllers/newsController.js";

const router = express.Router();

// Định nghĩa route GET để lấy tất cả tin tức
router.get("/", getNewsController);

export default router;