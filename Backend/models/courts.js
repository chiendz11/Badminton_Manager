import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
courtSchema.index({ centerId: 1, name: 1 }); // Để tìm kiếm các sân trong một trung tâm và sắp xếp/lọc theo tên
const Court = mongoose.model("Court", courtSchema);
export default Court;
