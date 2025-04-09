import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Star, 
  User, 
  LogOut, 
  ShoppingBag 
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  // Navigation handlers
  const goToCenter = () => navigate('/centersmanagement');
  const goToUsers = () => navigate('/users');
  const goToNews = () => navigate('/news');
  const goToBooking = () => navigate('/bookingsmanagement');
  const goToRating = () => navigate('/ratings');
  const goToAccount = () => navigate('/account');
  const goToShop = () => navigate('/shop');
  const handleLogout = () => navigate('/login');

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-blue-800 to-blue-900 p-6 flex flex-col justify-between fixed h-full">
        <div>
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
            </svg>
            Admin Panel
          </h2>
          <nav className="space-y-2">
            {[
              { label: 'Trang chủ', icon: <Home size={20} />, action: () => navigate('/dashboard') },
              { label: 'QL Người dùng', icon: <Users size={20} />, action: goToUsers },
              { label: 'QL Trung tâm', icon: <MapPin size={20} />, action: goToCenter },
              { label: 'QL Đặt sân', icon: <Calendar size={20} />, action: goToBooking },
              { label: 'QL Tin tức', icon: <Home size={20} />, action: goToNews },
              { label: 'Đánh giá', icon: <Star size={20} />, action: goToRating },
              { label: 'Cửa hàng', icon: <ShoppingBag size={20} />, action: goToShop },
            ].map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-100 hover:bg-blue-700/50 rounded-lg transition-all duration-300 hover:translate-x-2"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-blue-700/50 pt-4">
          <button
            onClick={goToAccount}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-blue-700/50 rounded-lg transition-colors"
          >
            <User size={20} />
            Tài khoản
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-100 hover:bg-red-700/50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 ml-64 p-8">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
