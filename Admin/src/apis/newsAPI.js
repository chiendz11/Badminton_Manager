// newsAPI.js
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Lấy danh sách tất cả bài viết.
 *
 * @returns {Promise<Array>} Danh sách các bài viết.
 */
export const getAllNews = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/news`);
    return response.data;
  } catch (error) {
    throw new Error(`Lỗi khi lấy danh sách bài viết: ${error.message}`);
  }
};

/**
 * Lấy thông tin bài viết theo ID.
 *
 * @param {String} id - ID của bài viết.
 * @returns {Promise<Object>} Thông tin chi tiết bài viết.
 */
export const getNewsById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/news/${id}`);
    return response;
  } catch (error) {
    throw new Error(`Lỗi khi lấy thông tin bài viết: ${error.message}`);
  }
};

/**
 * Tạo bài viết mới.
 *
 * @param {Object} newsData - Dữ liệu của bài viết cần tạo.
 * @returns {Promise<Object>} Bài viết mới được tạo.
 */
export const createNews = async (newsData) => {
  try {
    const response = await axios.post(`${API_URL}/api/news`, newsData);
    return response.data;
  } catch (error) {
    throw new Error(`Lỗi khi tạo bài viết: ${error.message}`);
  }
};

/**
 * Cập nhật bài viết theo ID.
 *
 * @param {String} id - ID của bài viết cần cập nhật.
 * @param {Object} newsData - Dữ liệu cập nhật của bài viết.
 * @returns {Promise<Object>} Bài viết sau khi cập nhật.
 */
export const updateNews = async (id, newsData) => {
  try {
    const response = await axios.put(`${API_URL}/api/news/${id}`, newsData);
    return response.data;
  } catch (error) {
    throw new Error(`Lỗi khi cập nhật bài viết: ${error.message}`);
  }
};

/**
 * Xóa bài viết theo ID.
 *
 * @param {String} id - ID của bài viết cần xóa.
 * @returns {Promise<Object>} Thông báo sau khi xóa bài viết.
 */
export const deleteNews = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/news/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Lỗi khi xóa bài viết: ${error.message}`);
  }
};
