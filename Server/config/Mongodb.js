import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Kết nối MongoDB thành công!");
  } catch (error) {
    console.error("❌ Lỗi kết nối MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
