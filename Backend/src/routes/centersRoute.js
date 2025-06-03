import express from "express";
import {
  getCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter,
} from "../controllers/centersController.js";

const router = express.Router();

// Lấy danh sách tất cả các nhà thi đấu
router.get("/", getCenters);

// Lấy thông tin 1 nhà thi đấu theo id
router.get("/:id", getCenterById);

// Tạo mới 1 nhà thi đấu
router.post("/", createCenter);

// Cập nhật thông tin 1 nhà thi đấu theo id
router.put("/:id", updateCenter);

// Xóa nhà thi đấu theo id
router.delete("/:id", deleteCenter);

export default router;
