// ======================
// File: services/ratingService.js
// ======================
import '../models/users.js'; // Import model để Mongoose đăng ký "User"
import Rating from '../models/ratings.js';

/**
 * Fetch ratings by center ID
 * @param {String} centerId
 */
export async function getRatingsByCenter(centerId) {
  return await Rating.find({ center: centerId })
    .populate('user', 'username email name') // <- chọn các field bạn cần từ user
    .sort({ createdAt: -1 });
}

/**
 * Delete a rating by its ID
 * @param {String} ratingId
 */
export async function deleteRatingById(ratingId) {
  return await Rating.findByIdAndDelete(ratingId);
}

export const getCommentsForCenterService = async (centerId) => {
  if (!centerId) {
    throw { status: 400, message: "Center ID is required" };
  }
  
  // Lấy danh sách đánh giá theo centerId, sắp xếp giảm dần theo thời gian tạo (giả sử có trường createdAt)
  const reviews = await Rating.find({ center: centerId }).sort({ createdAt: -1 });
  return reviews;
};
