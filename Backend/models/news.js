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
newsSchema.index({ createdAt: -1 }); // Để lấy tất cả tin tức và sắp xếp theo thời gian tạo mới nhất
newsSchema.index({ category: 1, createdAt: -1 }); // Để tìm tin tức theo danh mục và sắp xếp theo ngày
newsSchema.index({ title: 1 }); // Để tìm kiếm tin tức theo tiêu đề
const New = model("New", newsSchema);
export default New;
