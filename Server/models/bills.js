const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  billCode: { type: String, unique: true }, // Mã hóa đơn
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["daily", "monthly"], required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true }, // Chỉ có 1 booking
  totalAmount: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ["paid", "deposit"], 
    required: true
  },
  note: { type: String, default: "" }, // Ghi chú hóa đơn
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
