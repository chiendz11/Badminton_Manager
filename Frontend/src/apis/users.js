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

export const getUserById = async (userId) => {
  try {
    const res = await axiosInstance.get("/api/users/getUsers", {
      params: { userId },
    });
    return res.data; // Giả sử API trả về { name: "User Name", phone: "0123456789" }
  } catch (error) {
    console.error("Error fetching user info:", error.response?.data || error.message);
    return null;
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
