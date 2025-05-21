import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 500,

      // minPoolSize: Số lượng kết nối tối thiểu được duy trì.
      // Giúp giảm độ trễ cho các request đầu tiên sau khi không hoạt động.
      minPoolSize: 10,

      // connectTimeoutMS: Thời gian tối đa để thiết lập kết nối ban đầu.
      connectTimeoutMS: 10000, // 10 giây

      // serverSelectionTimeoutMS: Thời gian tối đa để driver tìm server phù hợp.
      serverSelectionTimeoutMS: 5000, // 5 giây
    });
    console.log("✅ Kết nối MongoDB thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error);
    process.exit(1); // Thoát ứng dụng nếu kết nối database thất bại
  }
};

export default connectDB;
