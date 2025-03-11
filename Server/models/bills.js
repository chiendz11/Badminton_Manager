import mongoose from "mongoose";
const { Schema, model } = mongoose;

const billSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

  centerId: { type: Schema.Types.ObjectId, ref: "Center", required: true, index: true }, // Thêm CenterId

  // Danh sách các booking đã xác nhận
  bookings: [{ type: Schema.Types.ObjectId, ref: "Booking", required: true }],

  // Tổng tiền (tính từ pricing của center)
  totalAmount: { type: Number, required: true },

  // Phương thức thanh toán
  paymentMethod: { type: String, default: "" },

  // Trạng thái thanh toán
  paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending", index: true },

  // Mã hóa đơn (tự động sinh)
  billCode: { type: String, unique: true, required: true, index: true },

  // Ghi chú (nếu có)
  note: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now, index: true }
});

// Middleware tạo billCode tự động nếu chưa có
billSchema.pre("save", async function (next) {
  if (!this.billCode) {
    let isUnique = false;
    while (!isUnique) {
      const now = new Date();
      const formattedDate = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 12);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // Random 4 số cuối để tránh trùng
      const newBillCode = `#Bill${formattedDate}${randomSuffix}`;

      // Kiểm tra xem billCode có bị trùng không
      const existingBill = await mongoose.models.Bill.findOne({ billCode: newBillCode });
      if (!existingBill) {
        this.billCode = newBillCode;
        isUnique = true;
      }
    }
  }
  next();
});

const Bill = model("Bill", billSchema);
export default Bill;
  