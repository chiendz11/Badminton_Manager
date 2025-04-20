// =====================
// File: routes/ratingRoutes.js
// =====================
import express from 'express';
import { getRatingsByCenterController, deleteRatingController, getCommentsForCenter } from '../controllers/ratingController.js';

const router = express.Router();

// GET /api/ratings/center/:centerId
router.get('/center/:centerId', getRatingsByCenterController);

// DELETE /api/ratings/:id
router.delete('/:id', deleteRatingController);

// GET /api/ratings?centerId=...
router.get("/get-ratings-for-center", getCommentsForCenter);

export default router;
