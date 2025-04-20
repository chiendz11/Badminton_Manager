// =====================
// File: routes/ratingRoutes.js
// =====================
import express from 'express';
import { getRatingsByCenterController, deleteRatingController } from '../controllers/ratingController.js';

const router = express.Router();

// GET /api/ratings/center/:centerId
router.get('/center/:centerId', getRatingsByCenterController);

// DELETE /api/ratings/:id
router.delete('/:id', deleteRatingController);

export default router;
