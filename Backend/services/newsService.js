// newsService.js
import New from "../models/news.js";



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

export const getAllNews = async () => {
  try {
    // Trả về tất cả các bản tin, sắp xếp theo thời gian tạo mới nhất
    const news = await New.find({}).sort({ createdAt: -1 });
    return news;
  } catch (error) {
    throw new Error("Error retrieving news: " + error.message);
  }
};