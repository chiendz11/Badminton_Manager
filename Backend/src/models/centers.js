import mongoose from "mongoose";
const { Schema, model } = mongoose;

// Schema cho cấu trúc giá cả theo khung giờ
const pricingSchema = new Schema(
  {
    startTime: {
      type: String,
      required: true,
      // Định dạng "HH:mm", ví dụ: "5:00"
      // Regex cho phép giờ từ 00-23 và phút 00-59
      match: [/^([01]?\d|2[0-3]):([0-5]\d)$/, "Invalid time format"],
    },
    endTime: {
      type: String,
      required: true,
      // Định dạng "HH:mm", ví dụ: "17:00"
      // Regex được cập nhật để cho phép 24:00
      match: [/^((?:[01]?\d|2[0-3]):[0-5]\d|24:00)$/, "Invalid time format"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false } // Không tạo _id cho các sub-document này
);

// Schema chính cho Center
const CenterSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      match: [/^\d{10,15}$/, "Please enter a valid phone number"],
    },
    imgUrl: {
      type: [String],
      default: [],
    },
    totalCourts: {
      type: Number,
      required: true,
      min: 1,
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    pricing: {
      weekday: {
        type: [pricingSchema],
        default: [],
        required: true,
      },
      weekend: {
        type: [pricingSchema],
        default: [],
        required: true,
      },
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    facilities: {
      type: [String],
      default: [],
    },
    bookingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true } // Tự động thêm createdAt và updatedAt
);

// --- Indexes ---
CenterSchema.index({ name: 1 });
CenterSchema.index({ avgRating: -1 });
CenterSchema.index({ bookingCount: -1 });

const Center = model("Center", CenterSchema);
export default Center;