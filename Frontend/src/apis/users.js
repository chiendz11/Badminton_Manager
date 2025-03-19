import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/api/users/register`, userData);
        console.log("Đăng ký thành công:", response.data);
        return response.data;
    } catch (error) {
        console.error("Lỗi đăng ký:", error.response?.data || error.message);
        throw error;
    }
};

export const getUserById = async (userId) => {
    try {
        const res = await axios.get(`${API_URL}/api/users/${userId}`);
        return res.data; // Giả sử API trả về { name: "User Name", phone: "0123456789" }
    } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
};