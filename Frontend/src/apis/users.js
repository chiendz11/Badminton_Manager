import axiosInstance from "../config/axiosConfig";

// Đăng ký người dùng
export const registerUser = async (userData) => {
  try {
    const response = await axiosInstance.post("/api/users/register", userData);
    console.log("Đăng ký thành công:", response.data);
    return response.data;
  } catch (error) {
    console.error("Lỗi đăng ký:", error.response?.data || error.message);
    throw error;
  }
};

// Đăng nhập người dùng
export const loginUser = async ({ username, password }) => {
  try {
    const response = await axiosInstance.post("/api/users/login", { username, password });
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error.response?.data || error.message);
    throw error;
  }
};

// Lấy thông tin người dùng
export const fetchUserInfo = async () => {
  try {
    const response = await axiosInstance.get("/api/users/me");
    return response.data;
  } catch (error) {
    console.error("Error fetching user info:", error.response?.data || error.message);
    throw error;
  }
};

// Đăng xuất người dùng
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.post('/api/users/logout', {});
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cập nhật thông tin người dùng
export const updateUserInfo = async (payload) => {
  try {
    const response = await axiosInstance.put("/api/users/update", payload);
    return response.data;
  } catch (error) {
    console.error("Error updating user info:", error.response?.data || error.message);
    throw error;
  }
};

// Cập nhật mật khẩu người dùng
export const updateUserPassword = async (payload) => {
  try {
    const response = await axiosInstance.put("/api/users/change-password", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Lấy dữ liệu biểu đồ
export const getChartData = async () => {
  try {
    const response = await axiosInstance.get("/api/users/get-chart");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy thống kê đặt sân chi tiết
export const getDetailedBookingStats = async (period = "month") => {
  try {
    const response = await axiosInstance.get(`/api/users/detailed-stats?period=${period}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Quên mật khẩu qua email
export const forgotPasswordByEmailSimpleApi = async (email) => {
  try {
    const response = await axiosInstance.post("/api/users/forgot-password-email", { email });
    return response.data;
  } catch (error) {
    console.error("Lỗi yêu cầu quên mật khẩu:", error.response?.data || error.message);
    throw error;
  }
};

// Gửi đánh giá
export const submitRating = async (ratingData) => {
  try {
    const response = await axiosInstance.post("/api/users/insert-ratings", ratingData);
    return response.data;
  } catch (error) {
    throw error.response && error.response.data.message
      ? error.response.data.message
      : error.message;
  }
};

