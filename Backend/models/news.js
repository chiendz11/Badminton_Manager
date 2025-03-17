import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Tiêu đề bài viết
  content: { type: String, required: true }, // Nội dung bài viết
  images: [{ type: String }], // Danh sách URL hình ảnh (nếu có)
  video: { type: String }, // URL video (YouTube, MP4, v.v.)
  author: { type: String, default: "Admin" }, // Người đăng bài
  tags: [{ type: String }], // Thẻ chủ đề (ví dụ: ["giải đấu", "kỹ thuật", "review"])
  views: { type: Number, default: 0 }, // Số lượt xem
  createdAt: { type: Date, default: Date.now }, // Ngày đăng
  updatedAt: { type: Date, default: Date.now } // Ngày cập nhật
});

const News = mongoose.model("News", newsSchema, "news");
export default News;
