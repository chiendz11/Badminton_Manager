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
