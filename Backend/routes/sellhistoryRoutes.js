import express from "express";
import * as controller from "../controllers/sellhistoryController.js";

const router = express.Router();

// Tất cả hóa đơn bán hàng
router.get("/", controller.getAll);

// Tạo hóa đơn mới
router.post("/", controller.create);

export default router;