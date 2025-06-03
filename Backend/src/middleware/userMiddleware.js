import mongoose from 'mongoose';
import Rating from "../models/ratings.js";
import Center from "../models/centers.js";
import nodemailer from "nodemailer";
import axios from "axios";
import User from "../models/users.js"; // Assuming User model is defined
export const updateAvgRating = async (centerId) => {
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


// Validate email format
const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check if email exists using Hunter.io API
export const checkEmailExistsService = async (email) => {
  // Step 1: Validate email format
  if (!validateEmailFormat(email)) {
    return { success: false, message: "Định dạng email không hợp lệ!" };
  }

  // Step 2: Check email existence via Hunter.io
  const apiKey = "b70f4eb3ad5581c2dafeffb3a8583b75fe275225";
  const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`;
  try {
    const response = await axios.get(url);
    const data = response.data.data;

    if (data.status === "invalid") {
      return { success: false, message: "Email không hợp lệ hoặc không tồn tại!" };
    }
    if (data.disposable) {
      return { success: false, message: "Email này là email tạm thời (disposable)!" };
    }
    if (data.block) {
      return { success: false, message: "Email bị chặn hoặc thuộc danh sách đen!" };
    }
    if (data.score < 50) {
      return { success: false, message: "Email không tồn tại hoặc không đáng tin cậy!" };
    }
    return {
      success: true,
      message: `Email hợp lệ! (Độ tin cậy: ${data.score}%)`,
    };
  } catch (error) {
    console.error("❌ Lỗi kiểm tra email:", error.response?.data || error.message);
    return { success: false, message: "Lỗi hệ thống khi kiểm tra email!" };
  }
};

// Check if email is already used by another user
export const checkEmailUniqueness = async (email, userId) => {
  try {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return { success: false, message: "Email này đã được sử dụng bởi người dùng khác!" };
    }
    return { success: true, message: "Email chưa được sử dụng." };
  } catch (error) {
    console.error("❌ Lỗi kiểm tra email trùng lặp:", error.message);
    return { success: false, message: "Lỗi hệ thống khi kiểm tra email trùng lặp!" };
  }
};

export const sendEmailService = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
            logger: true,  // Bật log chi tiết
            debug: true,   // Bật debug
            tls: {
                rejectUnauthorized: false,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_FROM_ADDRESS, // Địa chỉ gửi email
            to: to,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email đã được gửi:", info.messageId);
    } catch (error) {
        console.error("Lỗi khi gửi email:", error);
        throw new Error("Không thể gửi email.");
    }
};
