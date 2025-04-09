// src/routes/bookingRoutes.js
import express from 'express';
import * as bookingController from '../controllers/bookingController.js';

const router = express.Router();

// Tạo booking mới
router.post('/', bookingController.createBooking);

// Lấy danh sách booking (có thể filter theo query)
router.get('/', bookingController.listBookings);

// Lấy thông tin booking theo id
router.get('/:id', bookingController.getBooking);

// Cập nhật booking theo id
router.put('/:id', bookingController.updateBooking);

// Xóa booking theo id
router.delete('/:id', bookingController.deleteBooking);

export default router;
