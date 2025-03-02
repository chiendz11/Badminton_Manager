require('dotenv').config({ path: './server/.env' });  // Đường dẫn tới file .env trong thư mục server
const mongoose = require("mongoose");

// Lấy URL kết nối MongoDB từ biến môi trường
const MONGO_URI = process.env.MONGO_URI;

// Hàm kết nối database
const connectDB = async () => {
  try {
    // Kết nối MongoDB mà không cần tùy chọn deprecated
    await mongoose.connect(MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error);
    process.exit(1); // Dừng chương trình nếu không thể kết nối
  }
};

// Xuất hàm để sử dụng trong các file khác
module.exports = connectDB;
