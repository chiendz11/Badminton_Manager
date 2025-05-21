import mongoose from "mongoose";
const { Schema, model } = mongoose;

const pricingSchema = new Schema(
  {
    startTime: {
      type: String,
      required: true,
      // Định dạng "HH:mm", ví dụ: "5:00"
      match: [/^([01]?\d|2[0-3]):([0-5]\d)$/, "Invalid time format"],
    },
    endTime: {
      type: String,
      required: true,
      // Định dạng "HH:mm", ví dụ: "17:00"
      match: [/^([01]?\d|2[0-3]):([0-5]\d)$/, "Invalid time format"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

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
    avatar: {
      type: String,
      default: "",
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
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    pricing: {
      // Pricing được chia thành hai mảng: weekday và weekend.
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
    bookingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);
CenterSchema.index({ name: 1 }); // Để tìm kiếm/lọc theo tên trung tâm
CenterSchema.index({ avgRating: -1 }); // Để sắp xếp theo đánh giá trung bình (giảm dần)
CenterSchema.index({ bookingCount: -1 }); // Để sắp xếp theo số lượt đặt (giảm dần)
// Nếu bạn sử dụng truy vấn địa lý phức tạp hơn, hãy dùng '2dsphere'
CenterSchema.index({ "location.latitude": 1, "location.longitude": 1 }); // Cho các truy vấn dựa trên tọa độ

const Center = model("Center", CenterSchema);
export default Center;
