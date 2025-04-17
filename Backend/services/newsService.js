// newsService.js
import New from "../models/news.js";

// Lấy tất cả tin tức, sắp xếp giảm dần theo thời gian tạo
export const fetchAllNews = async () => {
  return await New.find().sort({ createdAt: -1 });
};

// Thêm tin tức mới
export const addNews = async (newsData) => {
  const news = new New(newsData);
  return await news.save();
};

// Lấy tin tức theo ID
export const fetchNewsById = async (id) => {
  return await New.findById(id);
};

// Cập nhật tin tức theo ID
export const modifyNews = async (id, updateData) => {
  return await New.findByIdAndUpdate(id, updateData, { new: true });
};

// Xoá tin tức theo ID
export const removeNews = async (id) => {
  return await New.findByIdAndDelete(id);
};
