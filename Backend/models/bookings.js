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
    let maxSlot = -Infinity;
    this.courts.forEach(court => {
      court.timeslots.forEach(slot => {
        if (slot > maxSlot) maxSlot = slot;
      });
    });
    if (maxSlot !== -Infinity) {
      if (this.status === "pending") {
        // TTL cho pending: ví dụ 1 phút (có thể điều chỉnh)
        this.expiresAt = new Date(this.createdAt.getTime() + 5 * 60 * 1000);
      } else if (this.status === "booked") {
        // Với booked: expiresAt là thời gian bắt đầu của timeslot lớn nhất
        // Chúng ta sử dụng định dạng ISO với offset +07:00 cho giờ Việt Nam
        const hourStr = maxSlot.toString().padStart(2, "0");
        this.expiresAt = new Date(`${this.date}T${hourStr}:00:00.000+07:00`);
      }
    }
  }
  next();
});

// TTL index: tự động xóa các document khi expiresAt hết hạn
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model("Booking", bookingSchema);