import express from 'express';
import { getInventories, createOrder } from '../controllers/inventoryController.js';

const router = express.Router();

// GET /api/inventories
router.get('/', getInventories);

// POST /api/inventories/checkout
router.post('/checkout', createOrder);

export default router;
