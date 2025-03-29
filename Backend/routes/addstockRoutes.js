// routes/addstockRoutes.js
import express from 'express';
import {
  getAllInventoriesController,
  addNewInventoryController
} from '../controllers/addstockController.js';

const router = express.Router();

/**
 * Lấy tất cả hàng
 * GET /api/addstock
 */
router.get('/', getAllInventoriesController);

/**
 * Thêm mới (nhập hàng)
 * POST /api/addstock
 */
router.post('/', addNewInventoryController);

export default router;
