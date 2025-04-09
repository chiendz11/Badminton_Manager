// src/apis/accountAPI.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Lấy thông tin tài khoản admin theo adminId
export const getAdminAccount = async (adminId) => {
  try {
    const response = await axios.get(`${API_URL}/api/admin/${adminId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cập nhật thông tin tài khoản admin theo adminId
export const updateAdminAccount = async (adminId, accountData) => {
  try {
    const response = await axios.put(`${API_URL}/api/admin/${adminId}`, accountData);
    return response.data;
  } catch (error) {
    throw error;
  }
};
