// =========================
// File: controllers/ratingController.js
// =========================
import * as ratingService from '../services/ratingService.js';

/**
 * Controller: get ratings for a specific center
 */
export async function getRatingsByCenterController(req, res, next) {
  try {
    const { centerId } = req.params;
    console.log('Fetching ratings for center:', centerId);
    const ratings = await ratingService.getRatingsByCenter(centerId);
    res.json(ratings);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: delete a specific rating
 */
export async function deleteRatingController(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await ratingService.deleteRatingById(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    res.json({ message: 'Rating deleted successfully' });
  } catch (err) {
    next(err);
  }
}