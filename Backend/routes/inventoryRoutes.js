import express from "express";
import {
  importStock,
  getStockHistory,
  getInventoryList,   // ← import thêm
  sellStock
} from "../controllers/inventoryController.js";

const router = express.Router();

// Nhập hàng
router.post("/import", importStock);

// Lịch sử nhập hàng
router.get("/import-history", getStockHistory);

// **Danh sách hàng trong kho**
router.get("/list", getInventoryList);

// Xuất kho (bán hàng)
router.post('/export', sellStock);

export default router;
