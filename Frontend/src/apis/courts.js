import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export const getCourtsByCenter = async (centerId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courts/${centerId}`);
    // Giả sử API trả về { success: true, data: [...] }
    return response.data.data; // Trả về mảng sân
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sân:", error.response?.data || error.message);
    throw error;
  }
};