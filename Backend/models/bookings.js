// booking.model.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const bookingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
  courts: [
    {
      courtId: { type: Schema.Types.ObjectId, ref: "Court", required: true },
      timeslots: [{ type: Number, required: true }],
    },
  ],
  date: { type: Date, required: true, index: true },
  // Status: pending, processing, paid, cancelled
  status: {
    type: String,
    enum: ["pending", "processing", "paid", "cancelled"],
    default: "pending",
    index: true,
  },
  expiresAt: { type: Date, default: null },
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  bookingCode: { type: String, unique: true, sparse: true, index: true },
  deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  type: { type: String, enum: ["fixed", "daily"], default: "daily", index: true },
  note: { type: String, default: "" },
  paymentImage: { type: Buffer, default: null },
  imageType: { type: String, default: "image/jpeg" },
  pointEarned: { type: Number, default: 0 },
});

// Middleware pre("save")
bookingSchema.pre("save", async function (next) {
  // Generate bookingCode only if it's a new document AND bookingCode is not set
  if (this.isNew && !this.bookingCode) {
    let isUnique = false;
    while (!isUnique) {
      const now = new Date();
      const formattedDate = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 12);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
      const newBookingCode = `#Bill${formattedDate}${randomSuffix}`;
      const existingBooking = await mongoose.models.Booking.findOne({ bookingCode: newBookingCode });
      if (!existingBooking) {
        this.bookingCode = newBookingCode;
        isUnique = true;
      }
    }
  }

  if (this.status === "pending" && this.isNew) {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
    this.expiresAt = new Date(this.createdAt.getTime() + 5 * 60 * 1000);
  } else if (this.status !== "pending") {
    this.expiresAt = null;
  }
  next();
});

// TTL index only applies to documents where expiresAt is not null
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// --- CÁC CHỈ MỤC ĐƯỢC GIỮ LẠI (KHÔNG TRÙNG LẶP) ---
// Chỉ mục cho truy vấn existingPendingBooking:
bookingSchema.index({ userId: 1, centerId: 1, date: 1, status: 1 });

// Chỉ mục cho truy vấn conflictingBookings (và getCourtStatus):
bookingSchema.index({ centerId: 1, date: 1, status: 1, deleted: 1 });

// Chỉ mục cho truy vấn lịch sử booking (getBookingHistory)
bookingSchema.index({ userId: 1, deleted: 1, date: -1 });

// Chỉ mục cho truy vấn getPopularTimeSlot
bookingSchema.index({ status: 1, userId: 1 });

// NEW: Chỉ mục để tối ưu hóa truy vấn trên mảng courts và timeslots (cho $elemMatch)
bookingSchema.index({ "courts.courtId": 1, "courts.timeslots": 1 });


const Booking = mongoose.models.Booking || model("Booking", bookingSchema);
export default Booking;
