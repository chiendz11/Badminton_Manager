


// newsController.js
import {
  addNews,
  fetchNewsById,
  modifyNews,
  removeNews,
  getAllNews
} from "../services/newsService.js";

export const getNewsController = async (req, res) => {
  try {
    const news = await getAllNews();
    res.status(200).json({ success: true, news });
  } catch (error) {
    console.error("Error in getNewsController:", error);
    res.status(500).json({ success: false, message: "Error fetching news" });
  }
};

// Tạo tin tức mới
export const createNews = async (req, res) => {
  try {
    const newNews = await addNews(req.body);
    res.status(201).json(newNews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết tin tức theo ID
export const getNewsById = async (req, res) => {
  try {
    const news = await fetchNewsById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật tin tức theo ID
export const updateNews = async (req, res) => {
  try {
    const updatedNews = await modifyNews(req.params.id, req.body);
    if (!updatedNews) {
      return res.status(404).json({ message: "News not found" });
    }
    res.status(200).json(updatedNews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xoá tin tức theo ID
export const deleteNews = async (req, res) => {
  try {
    const deletedNews = await removeNews(req.params.id);
    if (!deletedNews) {
      return res.status(404).json({ message: "News not found" });
    }
    res.status(200).json({ message: "News deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
