// routes/billManageRoutes.js
import express from 'express';
import { getAllBillsController, updateBillStatusController, searchUsersController, getAllCentersController } from '../controllers/billManageController.js';
import { protect, restrictToAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to get all bills, protected and restricted to admin
router.get('/get-all-bills', protect, restrictToAdmin, getAllBillsController);

// Route to update bill status, protected and restricted to admin
router.patch('/update-bill-status', protect, restrictToAdmin, updateBillStatusController);

// Route to search users, protected and restricted to admin
router.get('/search-users', protect, restrictToAdmin, searchUsersController);

// Route to get all centers, protected and restricted to admin
router.get('/get-centers', protect, restrictToAdmin, getAllCentersController);

export default router;