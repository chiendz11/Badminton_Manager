import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const updateAdminProfileAPI = async (token, data) => {
  const res = await axios.put(`${API_URL}/account/profile`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
