import express from 'express';
import { getCommentsForCenter } from '../controllers/ratingController.js';
import { restrictToClient, protect } from '../middleware/authMiddleware.js';
import e from 'express';

const router = express.Router();

router.get("/get-ratings-for-center", protect, restrictToClient, getCommentsForCenter);
export default router;