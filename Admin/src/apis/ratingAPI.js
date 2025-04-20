// ======================
// File: api/ratingAPI.js (frontend)
// ======================
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fetch ratings for a center
 * @param {String} centerId
 */
export function fetchRatings(centerId) {
  return axios.get(`${API_URL}/api/ratings/center/${centerId}`);
}

/**
 * Delete a rating by ID
 * @param {String} ratingId
 */
export function deleteRating(ratingId) {
  return axios.delete(`${API_URL}/api/ratings/${ratingId}`);
}