const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  billCode: { type: String, unique: true }, // Mã hóa đơn
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["daily", "monthly"], required: true },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }], // Gán với các đơn đặt lẻ
  monthlyBookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "MonthlyBooking" }], // Gán với các đơn cố định
  totalAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "deposit"], 
    default: function() {
      return this.type === "daily" ? "paid" : "pending";
    } 
  },
  createdAt: { type: Date, default: Date.now }
});

// Middleware tự động tạo billCode khi lưu
billSchema.pre("save", function(next) {
  if (!this.billCode) {
    const now = new Date();
    const typeCode = this.type === "daily" ? "D" : "M";
    const formattedDate = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 12); // YYYYMMDDHHMM
    this.billCode = `#B${typeCode}${formattedDate}`;
  }
  next();
});

const Bill = mongoose.model("Bill", billSchema, "bills");
module.exports = Bill;