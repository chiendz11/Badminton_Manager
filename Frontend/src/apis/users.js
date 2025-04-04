import axiosInstance from "../config/axiosConfig";

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



export const loginUser = async ({ username, password }) => {
  try {
    const response = await axiosInstance.post("/api/users/login", { username, password });
    // Giả sử API trả về { success: true, token: ..., ... }
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchUserInfo = async () => {
  try {
    const response = await axiosInstance.get("/api/users/me");
    return response.data; // Giả sử trả về { success: true, user: { ... } }
  } catch (error) {
    console.error("Error fetching user info:", error.response?.data || error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const response = await axiosInstance.post('/api/users/logout', {});
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserInfo = async (payload) => {
  try {
    const response = await axiosInstance.put("/api/users/update", payload, {
    });
    return response.data; // Giả sử trả về { success: true, user: { ... } }
  } catch (error) {
    console.error("Error updating user info:", error.response?.data || error.message);
    throw error;
  }
};


export const updateUserPassword = async (payload) => {
  try {
    const response = await axiosInstance.put("/api/users/change-password", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getChartData = async () => {
  try {
    // Không cần truyền userId, token từ cookie sẽ được gửi tự động
    const response = await axiosInstance.get("/api/users/get-chart");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDetailedBookingStats = async (period = "month") => {
  try {
    const response = await axiosInstance.get(`/api/users/detailed-stats?period=${period}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const forgotPasswordByEmailSimpleApi = async (email) => {
  try {
      const response = await axiosInstance.post("/api/users/forgot-password-email", { email });
      return response.data;
  } catch (error) {
      console.error("Lỗi yêu cầu quên mật khẩu:", error.response?.data || error.message);
      throw error;
  }
};

export const submitRating = async (ratingData) => {
  try {
    // Gửi dữ liệu đánh giá đến endpoint /api/ratings, withCredentials đảm bảo gửi cookie xác thực
    const response = await axiosInstance.post("/api/users/insert-ratings", ratingData);
    return response.data; // Giả sử trả về { message, rating }
  } catch (error) {
    throw error.response && error.response.data.message
      ? error.response.data.message
      : error.message;
  }
};