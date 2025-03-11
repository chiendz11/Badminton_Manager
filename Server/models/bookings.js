import mongoose from "mongoose";
const { Schema, model } = mongoose;

const bookingSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true },
  billId: { type: Schema.Types.ObjectId, ref: "Bill", index: true, sparse: true },
  courts: [
    {
      courtId: { type: Schema.Types.ObjectId, ref: "Court", required: true },
      timeslots: [{ type: Number, required: true }]
    }
  ],
  date: { type: String, required: true, index: true }, // Format: "YYYY-MM-DD"
  status: { type: String, enum: ["pending", "booked", "canceled"], default: "pending", index: true },
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
});

// Nếu muốn tự động xóa pending booking sau 60 giây, uncomment phần dưới
// bookingSchema.pre("save", function(next) {
//   if (this.status === "pending" && !this.expiresAt) {
//     this.expiresAt = new Date(this.createdAt.getTime() + 60000);
//   }
//   next();
// });
// bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model("Booking", bookingSchema);
