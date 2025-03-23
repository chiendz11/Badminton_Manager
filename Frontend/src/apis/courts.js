import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export const getCourtsByCenter = async (centerId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courts/getCourts`, {
      params: { centerId }
    });
    // Giả sử API trả về { success: true, data: [...] }
    return response.data.data; // Trả về mảng sân
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sân:", error.response?.data || error.message);
    throw error;
  }
};

export const getCourtStatusByBooking = async (centerId, date, courtId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courts/status`, {
      params: { centerId, date }
    });
    // Nếu không có dữ liệu cho court, trả về mảng mặc định (số slot = times.length - 1)
    return response.data[courtId] || Array(19).fill("trống");
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái booking:", error.response?.data || error.message);
    throw error;
  }
};

export const getPriceForTimeslot = async ({ centerId, date, timeslot }) => {
  try {
    const response = await axios.post(`${API_URL}/api/courts/slotPrice`, { centerId, date, timeslot });
    return response.data;
  } catch (error) {
    console.error("Error getting timeslot price:", error.response?.data || error.message);
    throw error;
  }
};

export const getCenterPricing = async (centerId) => {
  try {
    const response = await axios.get(`${API_URL}/api/courts/pricing`, {
      params: { centerId }
    });
    // Giả sử API trả về { success: true, pricing: { weekday: [...], weekend: [...] } }
    return response.data.pricing;
  } catch (error) {
    console.error("Error fetching center pricing:", error.response?.data || error.message);
    throw error;
  }
};