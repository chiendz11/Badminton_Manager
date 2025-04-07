import newsService from '../services/newsService.js';

export const getAllNews = async (req, res) => {
  try {
    const newsList = await newsService.getAllNews();
    res.status(200).json(newsList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNewsById = async (req, res) => {
  try {
    const news = await newsService.getNewsById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createNews = async (req, res) => {
  try {
    const newNews = await newsService.createNews(req.body);
    res.status(201).json(newNews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNews = async (req, res) => {
  try {
    const updatedNews = await newsService.updateNews(req.params.id, req.body);
    if (!updatedNews) {
      return res.status(404).json({ message: 'News not found' });
    }
    res.status(200).json(updatedNews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNews = async (req, res) => {
  try {
    const deletedNews = await newsService.deleteNews(req.params.id);
    if (!deletedNews) {
      return res.status(404).json({ message: 'News not found' });
    }
    res.status(200).json({ message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
