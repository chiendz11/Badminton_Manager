// src/api/adminAPI.js
import axios from 'axios';
  const API_URL = import.meta.env.VITE_API_URL;

  export async function loginAdmin(credentials) {
    try {
      const response = await axios.post(`${API_URL}/api/admin/login`, credentials);
      return response.data;
    } catch (error) {
      console.error('Error during admin login:', error);
      throw error;
    }
  };

  // Lấy thông tin tài khoản Admin theo id
  export const getAdminAccount = async (adminId) => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/account/${adminId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  
  // Cập nhật thông tin tài khoản Admin
  export const updateAdminAccount = async (adminId, accountData) => {
    try {
      const response = await axios.put(`${API_URL}/api/admin/account/${adminId}`, accountData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };