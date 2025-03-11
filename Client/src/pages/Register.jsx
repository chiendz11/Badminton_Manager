import { useState } from "react";
import { registerUser } from "../apis/users";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        address: "",
        username: "",
        password: ""
    });

    const [errorMessage, setErrorMessage] = useState(""); // Thêm state để lưu lỗi từ API

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
    
        console.log("Dữ liệu gửi đi:", formData); // Kiểm tra dữ liệu trước khi gửi
    
        try {
            const result = await registerUser(formData);
            alert("Đăng ký thành công!");
            console.log("Kết quả API:", result);
        } catch (error) {
            console.error("Lỗi API:", error.response?.data || error.message);
            setErrorMessage(error.response?.data?.message || "Đăng ký thất bại! Vui lòng thử lại.");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Họ và tên" onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
            <input type="text" name="phone_number" placeholder="Số điện thoại" onChange={handleChange} required />
            <input type="text" name="address" placeholder="Địa chỉ" onChange={handleChange} required />
            <input type="text" name="username" placeholder="Tên đăng nhập" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Mật khẩu" onChange={handleChange} required />
            <button type="submit">Đăng ký</button>

            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>} {/* Hiển thị lỗi nếu có */}
        </form>
    );
};

export default Register;
