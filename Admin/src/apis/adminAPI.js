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
