import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

// Lấy danh sách tất cả bài viết
export const getAllNews = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/news`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy thông tin bài viết theo ID
export const getNewsById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/news/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Tạo bài viết mới
export const createNews = async (newsData) => {
  try {
    const response = await axios.post(`${API_URL}/api/news`, newsData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cập nhật bài viết theo ID
export const updateNews = async (id, newsData) => {
  try {
    const response = await axios.put(`${API_URL}/api/news/${id}`, newsData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Xóa bài viết theo ID
export const deleteNews = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/news/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
