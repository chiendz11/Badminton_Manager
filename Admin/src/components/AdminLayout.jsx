// src/components/AdminLayout.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, MapPin, Calendar, CreditCard, Star, User, LogOut } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const goToCenter = () => navigate('/centersmanagement');
  const goToUsers = () => navigate('/users');
  const goToNews = () => navigate('/news');
  const goToBooking = () => navigate('/bookingsmanagement');
  const goToRating = () => navigate('/ratings');
  const goToAccount = () => navigate('/account');
  const handleLogout = () => {
    // Có thể xóa token, localStorage, v.v.
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar bên trái */}
      <div className="w-64 bg-blue-100 p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blue-600 mb-6">ADMIN</h2>
          <nav className="space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
            >
              <Home size={18} />
              Trang chủ
            </button>
            <button
              onClick={goToUsers}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
            >
              <Users size={18} />
              Quản lý người dùng
            </button>
            <button
              onClick={goToCenter}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
            >
              <MapPin size={18} />
              Quản lý trung tâm
            </button>
            <button
              onClick={goToBooking}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
            >
              <Calendar size={18} />
              Quản lý đặt sân
            </button>
            <button
              onClick={() => navigate('/payments')}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
            >
              <CreditCard size={18} />
              Quản lý thanh toán
            </button>
            <button
              onClick={goToNews}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
            >
              <Home size={18} />
              Quản lý tin tức
            </button>
            <button
              onClick={goToRating}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
            >
              <Star size={18} />
              Đánh giá
            </button>
          </nav>
        </div>
        <div className="mt-8 space-y-4">
          <button
            onClick={goToAccount}
            className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
          >
            <User size={18} />
            Trang cá nhân
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Nội dung bên phải */}
      <div className="flex-1 bg-gray-100 p-6">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
