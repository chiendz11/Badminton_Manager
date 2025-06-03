import mongoose from "mongoose";
const { Schema, model } = mongoose;

const FavouriteCenterSchema = new Schema(
  {
    centerName: { type: String, required: true, trim: true },
    bookingCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Chỉ mục duy nhất tự động được tạo
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone_number: {
      type: String,
      required: true,
      unique: true, // Chỉ mục duy nhất tự động được tạo
      match: [/^\d{10,15}$/, "Please enter a valid phone number"],
    },
    registration_date: {
      type: Date,
      default: Date.now,
    },
    username: {
      type: String,
      trim: true,
      default: "",
      unique: true, // Rất quan trọng cho loginUserService
      sparse: true, // Cho phép nhiều tài liệu có username là null/empty string nếu bạn có logic đó
    },
    password_hash: {
      type: String,
      default: "",
    },
    avatar_image_path: {
      type: String,
      default: "",
    },
    // Các trường bổ sung:
    level: {
      type: String,
      default: "Thành viên Iron",
    },
    points: {
      type: Number,
      default: 0,
    },
    favouriteCenter: {
      type: [FavouriteCenterSchema],
      default: [],
    },
    stats: {
      totalBookings: { type: Number, default: 0 },
      completedBookings: { type: Number, default: 0 },
      cancelledBookings: { type: Number, default: 0 },
      averagePlayTime: { type: String, default: "0 phút" },
    },
    // Thêm các trường cho đặt lại mật khẩu
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Number,
    },
    failed_login_attempts: { type: Number, default: 0 },
    lock_until: { type: Date, default: null }
  },
  { timestamps: true }
);

UserSchema.index({ registration_date: -1 });
UserSchema.index({ points: -1 });
UserSchema.index({ "stats.completedBookings": -1 });
UserSchema.index({ "favouriteCenter.centerName": 1 });
const User = mongoose.models.User || model("User", UserSchema);

export default User;
