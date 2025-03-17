import mongoose from "mongoose";

const CenterSchema = new mongoose.Schema(
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
    pricing: [
      {
        startTime: {
          type: String,
          required: true,
          match: [/^([01]?\d|2[0-3]):([0-5]\d)$/, "Invalid time format"],
        },
        endTime: {
          type: String,
          required: true,
          match: [/^([01]?\d|2[0-3]):([0-5]\d)$/, "Invalid time format"],
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

const Center = mongoose.model("Center", CenterSchema);
export default Center;
