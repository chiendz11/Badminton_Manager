// src/api/accountAPI.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const getCurrentAdmin = async () => {
  const res = await axios.get(`${API_URL}/api/account/me`, { withCredentials: true });
  return res.data;
};

export const updateAdminAccount = async (adminData) => {
  const res = await axios.put(`${API_URL}/api/account/update`, adminData, {
    withCredentials: true,
  });
  return res.data;
};
