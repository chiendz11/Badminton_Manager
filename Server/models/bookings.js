const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courtId: { type: mongoose.Schema.Types.ObjectId, ref: "Court", required: true },
  
  type: { type: String, enum: ["daily", "monthly"], required: true }, // daily hoặc monthly
  startDate: { type: Date, required: true }, // Nếu daily => ngày đặt | Nếu monthly => ngày bắt đầu
  endDate: { type: Date }, // Chỉ dùng cho monthly booking

  timeSlots: [{ type: String, required: true }], // VD: ["06:00", "06:30"]
  daysOfWeek: [{ type: Number, enum: [2, 3, 4, 5, 6, 7, 8] }], // Dùng cho đặt cố định (monthly)

  status: { type: String, enum: ["pending", "deposit", "booked"], default: "pending" }, // Trạng thái đặt
  totalAmount: { type: Number, required: true },
  depositAmount: { type: Number, default: 0 }, // Tiền cọc cho đặt sân cố định

  expiresAt: { type: Date }, // Dùng để tự động hủy giữ chỗ nếu pending quá lâu
  createdAt: { type: Date, default: Date.now }
});

// Middleware tính `endDate` cho monthly booking
bookingSchema.pre("save", function (next) {
  if (this.type === "monthly" && this.startDate && this.daysOfWeek.length > 0) {
    const end = new Date(this.startDate);
    end.setMonth(end.getMonth() + 1); // Mặc định đặt sân cố định là 1 tháng
    this.endDate = end;
  }
  next();
});

// Tự động xóa booking "pending" sau X phút
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Booking = mongoose.model("Booking", bookingSchema, "bookings");
module.exports = Booking;
