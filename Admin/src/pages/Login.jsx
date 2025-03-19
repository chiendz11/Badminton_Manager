import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../apis/adminAPI.js';
import { Eye, EyeOff, X } from 'lucide-react';
import pic1 from '../image/pic1.jpg';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook dùng để chuyển hướng

  const togglePassword = () => setShowPassword(!showPassword);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleLogin = async () => {
    try {
      setError(null);
      const response = await loginAdmin(loginData);
      console.log('Login successful:', response);
      // Sau khi đăng nhập thành công, chuyển hướng sang trang Dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${pic1})` }}
    >
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-green-800 mb-1">Đăng nhập - Chủ sân</h2>
        <p className="text-sm text-gray-600 mb-6">ALOBO - Quản lý sân thể thao</p>

        {error && <p className="text-center text-red-500 mb-4">{error}</p>}

        <div className="relative mb-4">
          <input
            name="username"
            type="text"
            placeholder="Số điện thoại hoặc email"
            className="w-full p-3 border rounded-md focus:outline-none focus:border-green-500"
            value={loginData.username}
            onChange={handleInputChange}
          />
          <X className="absolute right-3 top-3 text-gray-500 cursor-pointer" />
        </div>

        <div className="relative mb-4">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            className="w-full p-3 border rounded-md focus:outline-none focus:border-green-500"
            value={loginData.password}
            onChange={handleInputChange}
          />
          {showPassword ? (
            <EyeOff
              className="absolute right-3 top-3 text-gray-500 cursor-pointer"
              onClick={togglePassword}
            />
          ) : (
            <Eye
              className="absolute right-3 top-3 text-gray-500 cursor-pointer"
              onClick={togglePassword}
            />
          )}
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-green-600 text-white py-3 rounded-md mb-4 hover:bg-green-700"
        >
          ĐĂNG NHẬP
        </button>

        <p className="text-center text-sm text-orange-600 mb-4">
          Nếu bạn là KHÁCH CHƠI, bấm vào đây để tải ứng dụng ALOBO - Tìm kiếm và đặt lịch
        </p>

        <p className="text-center text-sm">
          Bạn chưa có tài khoản? <span className="text-green-600 cursor-pointer">Xem hướng dẫn</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
