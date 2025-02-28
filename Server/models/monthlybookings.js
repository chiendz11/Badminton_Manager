const mongoose = require("mongoose");

const monthlyBookingSchema = new mongoose.Schema({
  courtId: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  month: { type: String, required: true }, // YYYY-MM (VD: "2024-07")
  duration: { type: Number, required: true }, // Số tháng đặt sân (VD: 3 tháng)
  timeSlots: [
    {
      time: { type: String, required: true } // VD: "06:00", "06:30"
    }
  ],
  daysOfWeek: [{ type: Number, enum: [2, 3, 4, 5, 6, 7, 8], required: true }], // 2: Thứ 2, ..., 8: Chủ Nhật
  status: { type: String, enum: ["pending", "booked"], default: "pending" }, // Trạng thái đặt sân
  billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" }, // Nếu đã thanh toán
  createdAt: { type: Date, default: Date.now }
});

const MonthlyBooking = mongoose.model("MonthlyBooking", monthlyBookingSchema, "monthly_bookings");
module.exports = MonthlyBooking;
