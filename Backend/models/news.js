import mongoose from "mongoose";
const { Schema, model } = mongoose;

const newsSchema = new Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  image: { type: String, required: true }, // URL của ảnh
  category: { type: String, required: true },
  date: { type: String, required: true }, // Có thể chuyển sang Date nếu bạn muốn
  source: { type: String, required: true },
  url: { type: String, required: true }
}, { timestamps: true });

const New = model("New", newsSchema);
export default New;
