const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  courtId: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  timeSlots: [
    {
      time: { type: String, required: true }, // VD: "06:00", "06:30"
      status: { type: String, enum: ["pending", "booked", "available"], default: "pending" }
    }
  ],
  billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" }, // Chỉ cần 1 billId cho toàn bộ booking
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model("Booking", bookingSchema, "bookings");
module.exports = Booking;