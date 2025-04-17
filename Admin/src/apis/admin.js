// src/api/adminAPI.js
import axiosInstance from '../config/axiosConfig'; // Đường dẫn tới file định nghĩa axiosInstance

export async function loginAdmin(credentials) {
  try {
    const response = await axiosInstance.post('/api/admin/login', credentials);
    return response.data;
  } catch (error) {
    console.error('Error during admin login:', error);
    throw error.response?.data || { success: false, message: 'Lỗi khi đăng nhập admin' };
  }
};