import Rating from '../models/ratings.js';
import Center from '../models/centers.js';

// Hàm cập nhật điểm trung bình cho center
const updateAvgRating = async (centerId) => {
  const ratings = await Rating.find({ center: centerId });
  if (ratings.length > 0) {
    const avg = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
    await Center.findByIdAndUpdate(centerId, { avgRating: avg });
  } else {
    await Center.findByIdAndUpdate(centerId, { avgRating: 0 });
  }
};

const insertRating = async ({ centerId, userId, stars, comment }) => {
  if (!centerId || !userId || !stars) {
    throw new Error("Vui lòng điền đầy đủ thông tin!");
  }
  if (stars < 1 || stars > 5) {
    throw new Error("Số sao phải từ 1 đến 5!");
  }
  // Kiểm tra xem user đã đánh giá center này chưa
  const existing = await Rating.findOne({ center: centerId, user: userId });
  if (existing) {
    throw new Error("Bạn đã đánh giá sân này rồi!");
  }
  const newRating = new Rating({
    center: centerId,
    user: userId,
    stars,
    comment,
  });
  await newRating.save();
  await updateAvgRating(centerId);
  return newRating;
};

const updateRating = async (id, data) => {
  const rating = await Rating.findByIdAndUpdate(id, data, { new: true });
  if (rating) {
    await updateAvgRating(rating.center);
  }
  return rating;
};

const deleteRating = async (id) => {
  const rating = await Rating.findByIdAndDelete(id);
  if (rating) {
    await updateAvgRating(rating.center);
  }
  return rating;
};

const getAllRatings = async () => {
  // Sử dụng populate để lấy thông tin liên quan từ center và user
  return await Rating.find().populate('center user');
};

const getRatingById = async (id) => {
  return await Rating.findById(id).populate('center user');
};

export default {
  insertRating,
  updateRating,
  deleteRating,
  getAllRatings,
  getRatingById,
  updateAvgRating,
};
