import express from 'express';
import { getCommentsForCenter } from '../controllers/ratingController.js';
import { restrictToClient, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get("/get-ratings-for-center", getCommentsForCenter);
export default router;