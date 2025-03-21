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
  },
  { timestamps: true }
);

const Center = model("Center", CenterSchema);
export default Center;
