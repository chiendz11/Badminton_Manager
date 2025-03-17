import mongoose from "mongoose";

const courtSchema = new mongoose.Schema({
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Court = mongoose.model("Court", courtSchema);
export default Court;
