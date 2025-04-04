import express from "express";
import { getCommentsForCenter } from "../controllers/ratingController.js";

const router = express.Router();

// GET /api/ratings?centerId=...
router.get("/get-ratings-for-center", getCommentsForCenter);

export default router;