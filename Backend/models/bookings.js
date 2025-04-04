import mongoose from "mongoose";
const { Schema, model } = mongoose;

const bookingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
  courts: [
    {
      courtId: { type: Schema.Types.ObjectId, ref: "Court", required: true },
      timeslots: [{ type: Number, required: true }]
    }
  ],
  date: { type: Date, required: true, index: true },
  // Status: pending, paid, cancelled
  status: {
    type: String,
    enum: ["pending", "paid", "cancelled"],
    default: "pending",
    index: true
  },
  expiresAt: { type: Date, default: null },
  // Tổng tiền (tính từ pricing của center)
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, index: true },

  // Các trường dành cho đơn đã thanh toán/hủy (bill)
  paymentMethod: { type: String, default: "" },
  // Đổi tên trường từ billCode thành bookingCode
  bookingCode: { type: String, unique: true, sparse: true, default: null, index: true },
  type: { type: String, enum: ["fixed", "daily"], default: "daily", index: true },
  note: { type: String, default: "" },
  paymentImage: { type: Buffer, default: null },
  imageType: { type: String, default: "image/jpeg" },
  pointEarned: { type: Number, default: 0 }
});

// Middleware pre("save"):
bookingSchema.pre("save", async function (next) {
  // Nếu đơn đang pending, thiết lập expiresAt (ví dụ: 5 phút kể từ createdAt)
  if (this.status === "pending") {
    if (this.date) {
      let maxSlot = -Infinity;
      this.courts.forEach(court => {
        court.timeslots.forEach(slot => {
          if (slot > maxSlot) maxSlot = slot;
        });
      });
      if (maxSlot !== -Infinity) {
        this.expiresAt = new Date(this.createdAt.getTime() + 5 * 60 * 1000);
      }
    }
  } else {
    // Với các đơn không pending (paid, cancelled), không thiết lập expiresAt
    this.expiresAt = null;
    // Nếu đơn không pending và chưa có bookingCode, tự tạo bookingCode
    if (!this.bookingCode) {
      let isUnique = false;
      while (!isUnique) {
        const now = new Date();
        const formattedDate = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 12);
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const newBookingCode = `#Bill${formattedDate}${randomSuffix}`;
        const existingBooking = await mongoose.models.Booking.findOne({ bookingCode: newBookingCode });
        if (!existingBooking) {
          this.bookingCode = newBookingCode;
          isUnique = true;
        }
      }
    }
  }
  next();
});

// TTL index chỉ áp dụng cho các đơn pending (expiresAt khác null)
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Booking = mongoose.models.Booking || model("Booking", bookingSchema);
export default Booking;
