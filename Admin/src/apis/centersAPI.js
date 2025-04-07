import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Lấy danh sách các nhà thi đấu
export const getCentersAPI = async () => {
  if (!API_URL) {
    throw new Error("VITE_API_URL không được định nghĩa trong file .env");
  }
  const response = await axios.get(`${API_URL}/api/centers`);
  return response.data;
};

// Lấy thông tin 1 nhà thi đấu theo id
export const getCenterByIdAPI = async (id) => {
  const response = await axios.get(`${API_URL}api/centers/${id}`);
  return response.data;
};

// Tạo mới 1 nhà thi đấu
export const createCenterAPI = async (centerData) => {
  const response = await axios.post(`${API_URL}api/centers`, centerData);
  return response.data;
};

// Cập nhật thông tin 1 nhà thi đấu theo id
export const updateCenterAPI = async (id, centerData) => {
  const response = await axios.put(`${API_URL}api/centers/${id}`, centerData);
  return response.data;
};

// Xóa 1 nhà thi đấu theo id
export const deleteCenterAPI = async (id) => {
  const response = await axios.delete(`${API_URL}api/centers/${id}`);
  return response.data;
};
