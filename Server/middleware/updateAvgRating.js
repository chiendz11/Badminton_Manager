const mongoose = require('mongoose');
const Rating = require("../models/ratings");
const Center = require("../models/centers");

const updateAvgRating = async (centerId) => {
  try {
    // Tạo ObjectId hợp lệ từ centerId bằng cách sử dụng 'new'
    const objectId = new mongoose.Types.ObjectId(centerId);

    // Tính toán điểm trung bình từ tất cả các đánh giá của center
    const ratings = await Rating.aggregate([
      { $match: { center: objectId } }, // Sử dụng objectId thay vì centerId thô
      { $group: { _id: "$center", avgRating: { $avg: "$stars" } } } // Tính trung bình stars
    ]);

    console.log("🔍 Kết quả từ aggregate:", ratings); // In ra kết quả từ aggregate

    const newAvg = ratings.length > 0 ? ratings[0].avgRating : 0; // Nếu có đánh giá thì lấy trung bình, nếu không thì gán 0
    console.log("🔍 newAvg:", newAvg); // In ra giá trị của newAvg

    // Cập nhật avgRating vào Center
    await Center.findByIdAndUpdate(centerId, { avgRating: newAvg });
    console.log(`✅ Đã cập nhật avgRating cho Center ${centerId}: ${newAvg}`);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật avgRating:", error);
  }
};

module.exports = updateAvgRating;