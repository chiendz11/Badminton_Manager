// =====================
// File: routes/ratingRoutes.js
// =====================
import express from 'express';
import { getRatingsByCenterController, deleteRatingController, getCommentsForCenter } from '../controllers/ratingController.js';
import {protect, restrictToAdmin } from '../middleware/authMiddleware.js';
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

router.get("/get-ratings-for-center",protect, restrictToAdmin, getCommentsForCenter);
// GET /api/ratings/center/:centerId
router.get('/center/:centerId', protect, restrictToAdmin, getRatingsByCenterController);

// DELETE /api/ratings/:id
router.delete('/:id', protect, restrictToAdmin, csrfProtection, deleteRatingController);

// GET /api/ratings?centerId=...


export default router;
