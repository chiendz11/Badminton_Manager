import express from 'express';
import {
  updateRating,
  deleteRating,
  getAllRatings,
  getRatingById,
} from '../controllers/ratingController.js';

const router = express.Router();

// Lấy danh sách tất cả rating
router.get('/', getAllRatings);

// Lấy rating theo id
router.get('/:id', getRatingById);

// Cập nhật rating
router.put('/:id', updateRating);

// Xóa rating
router.delete('/:id', deleteRating);

export default router;
