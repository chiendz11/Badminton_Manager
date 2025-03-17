  import axios from "axios";
  const API_URL = import.meta.env.VITE_API_URL;

  export const getBookingStatusByCourt = async (centerId, date, courtId) => {
    try {
      const response = await axios.get(`${API_URL}/api/booking/status`, {
        params: { centerId, date }
      });
      // Nếu không có dữ liệu cho court, trả về mảng mặc định (số slot = times.length - 1)
      return response.data[courtId] || Array(19).fill("trống");
    } catch (error) {
      console.error("Lỗi khi lấy trạng thái booking:", error.response?.data || error.message);
      throw error;
    }
  };
