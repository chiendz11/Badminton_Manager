const Rating = require("../models/ratings");
const updateAvgRating = require("../middleware/updateAvgRating");


const testInsertRating = async () => {
  try {
    
    const centerId = "67bcab5646f2f0993a4d7945"; // ID của sân cần đánh gi

    const newRating = new Rating({
      center: centerId,
      user: "67bd323489acfa439c4d7942",
      stars: 5,
      comment: "Test đánh giá từ script!"
    });

    await newRating.save();
    console.log("✅ Đã thêm rating test thành công!");

    // Cập nhật avgRating ngay sau khi thêm rating mới
    await updateAvgRating(centerId);
    console.log("🔄 Đã cập nhật avgRating thành công!");

  } catch (error) {
    console.error("❌ Lỗi khi thêm rating test:", error);
  }
};

module.exports = testInsertRating
