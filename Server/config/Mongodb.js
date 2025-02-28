require("dotenv").config();
const mongoose = require("mongoose");

// Lấy URL kết nối MongoDB từ biến môi trường
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/BadmintonManager";

// Hàm kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Kết nối MongoDB thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error);
    process.exit(1); // Dừng chương trình nếu không thể kết nối
  }
};

// Xuất hàm để sử dụng trong các file khác
module.exports = connectDB;
