import Rating from "../models/ratings.js";

export const getCommentsForCenterService = async (centerId) => {
  if (!centerId) {
    throw { status: 400, message: "Center ID is required" };
  }
  
  // Lấy danh sách đánh giá theo centerId, sắp xếp giảm dần theo thời gian tạo (giả sử có trường createdAt)
  const reviews = await Rating.find({ center: centerId }).sort({ createdAt: -1 });
  return reviews;
};