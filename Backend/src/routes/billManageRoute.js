import express from 'express';
import { getAllBillsController, updateBillStatusController, searchUsersController, getAllCentersController, getAvailableCourtsController, createFixedBookingsController } from '../controllers/billManageController.js';
import { protect, restrictToAdmin } from '../middleware/authMiddleware.js';
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

// Route to get all bills, protected and restricted to admin
router.get('/get-all-bills', protect, restrictToAdmin, getAllBillsController);

// Route to update bill status, protected and restricted to admin
router.patch('/update-bill-status', protect, restrictToAdmin, csrfProtection, updateBillStatusController);

// Route to search users, protected and restricted to admin
router.get('/search-users', protect, restrictToAdmin, searchUsersController);

// Route to get all centers, protected and restricted to admin
router.get('/get-centers', protect, restrictToAdmin, getAllCentersController);

// Route to get available courts, protected and restricted to admin
router.post('/available-courts', protect, restrictToAdmin, csrfProtection, getAvailableCourtsController);

// Route to create fixed bookings, protected and restricted to admin
router.post('/fixed-bookings', protect, restrictToAdmin, csrfProtection, createFixedBookingsController);

export default router;