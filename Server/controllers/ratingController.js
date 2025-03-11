const Rating = require("../models/Ratings");
const Center = require("../models/Centers");

// Thêm đánh giá từ người dùng
const insertRating = async (req, res) => {
  try {
    const { centerId, userId, stars, comment } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!centerId || !userId || !stars) {
      return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin!" });
    }

    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Số sao phải từ 1 đến 5!" });
    }

    // Kiểm tra xem user đã đánh giá sân này chưa (nếu chỉ cho phép đánh giá 1 lần)
    const existingRating = await Rating.findOne({ center: centerId, user: userId });
    if (existingRating) {
      return res.status(400).json({ message: "Bạn đã đánh giá sân này rồi!" });
    }

    // Tạo đánh giá mới
    const newRating = new Rating({
      center: centerId,
      user: userId,
      stars,
      comment
    });

    // Lưu vào database
    await newRating.save();
    console.log("✅ Đã thêm rating thành công!");

    // Cập nhật avgRating của sân
    await updateAvgRating(centerId);

    res.status(201).json({ message: "Đánh giá thành công!", rating: newRating });

  } catch (error) {
    console.error("❌ Lỗi khi thêm đánh giá:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
};
