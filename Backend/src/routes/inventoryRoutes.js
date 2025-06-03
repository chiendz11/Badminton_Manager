import express from "express";
import {
  importStock,
  getStockHistory,
  getInventoryList,   // ← import thêm
  sellStock
} from "../controllers/inventoryController.js";
import { protect, restrictToAdmin } from "../middleware/authMiddleware.js";
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

// Nhập hàng
router.post("/import", protect, restrictToAdmin, csrfProtection, importStock);

// Lịch sử nhập hàng
router.get("/import-history", protect, restrictToAdmin, getStockHistory);

// **Danh sách hàng trong kho**
router.get("/list", protect, restrictToAdmin, getInventoryList);

// Xuất kho (bán hàng)
router.post('/export', protect, restrictToAdmin, csrfProtection, sellStock);

export default router;
