// =====================
// File: routes/ratingRoutes.js
// =====================
import express from 'express';
import { getRatingsByCenterController, deleteRatingController, getCommentsForCenter } from '../controllers/ratingController.js';
import { restrictToClient, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get("/get-ratings-for-center",protect, restrictToClient, getCommentsForCenter);
// GET /api/ratings/center/:centerId
router.get('/center/:centerId', getRatingsByCenterController);

// DELETE /api/ratings/:id
router.delete('/:id', deleteRatingController);

// GET /api/ratings?centerId=...


export default router;
