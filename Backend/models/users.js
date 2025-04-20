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
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone_number: {
      type: String,
      required: true,
      unique: true,
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
  },
  { timestamps: true }
);



// Kiểm tra nếu model User đã được tạo, dùng model đó; nếu chưa thì tạo mới.
const User = mongoose.models.User || model("User", UserSchema);

export default User;