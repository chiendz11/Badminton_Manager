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
    date: { type: String, required: true, index: true },
    status: { type: String, enum: ["pending", "booked"], default: "pending", index: true },
    expiresAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, index: true }
  });

  bookingSchema.pre("save", function (next) {
    if (this.date) {
      let minSlot = Infinity;
      this.courts.forEach(court => {
        court.timeslots.forEach(slot => {
          if (slot < minSlot) minSlot = slot;
        });
      });
      if (minSlot !== Infinity) {
        if (this.status === "pending") {
          // pending: ở DB nên có TTL (ví dụ 5 phút)
          this.expiresAt = new Date(this.createdAt.getTime() + 5 * 60 * 1000);
        } else if (this.status === "booked") {
          // booked: expiredAt là thời gian bắt đầu của timeslot nhỏ nhất trong ngày đặt
          this.expiresAt = new Date(`${this.date}T${minSlot.toString().padStart(2, "0")}:00:00.000Z`);
        }
      }
    }
    next();
  });
  bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  export default model("Booking", bookingSchema);
