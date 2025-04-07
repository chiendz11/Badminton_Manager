import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

// Lấy danh sách rating
export const getAllRatings = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/ratings`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy rating theo id
export const getRatingById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/ratings/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cập nhật rating
export const updateRating = async (id, ratingData) => {
  try {
    const response = await axios.put(`${API_URL}/api/ratings/${id}`, ratingData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Xóa rating
export const deleteRating = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/api/ratings/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
