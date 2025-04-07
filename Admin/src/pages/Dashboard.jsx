import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllNews } from '../apis/newsAPI.js';
import { getAllRatings } from '../apis/ratingAPI.js';
import { getPendingMapping } from '../apis/bookingsAPI.js';

// Icon minh họa, bạn có thể thay bằng icon của riêng mình
import { Home, Users, MapPin, Calendar, CreditCard, Star, User, LogOut, ShoppingBag } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [ratings, setRatings] = useState([]);

  // Navigation handlers
  const goToCenter = () => navigate('/centersmanagement');
  const goToUsers = () => navigate('/users');
  const goToNews = () => navigate('/news');
  const goToBooking = () => navigate('/bookingsmanagement');
  const goToRating = () => navigate('/ratings');
  const goToAccount = () => navigate('/account');
  const goToShop = () => navigate('/shop'); // Hàm điều hướng đến cửa hàng
  const handleLogout = () => {
    // Có thể xóa token, localStorage, v.v. ở đây
    navigate('/login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách tin tức
        const newsData = await getAllNews();
        setNews(Array.isArray(newsData) ? newsData.slice(0, 3) : []);

        // Lấy danh sách booking (giả định API trả về dạng { bookings: [...] })
        const bookingResponse = await getPendingMapping();
        const bookingList = Array.isArray(bookingResponse.bookings)
          ? bookingResponse.bookings.slice(0, 3)
          : [];
        setBookings(bookingList);

        // Lấy danh sách đánh giá
        const ratingData = await getAllRatings();
        setRatings(Array.isArray(ratingData) ? ratingData.slice(0, 3) : []);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    };

    fetchData();
  }, []);

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
            <button
              onClick={goToShop}
              className="flex items-center gap-2 text-blue-900 hover:text-blue-700 transition-colors"
            >
              <ShoppingBag size={18} />
              Cửa hàng
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
        <h1 className="text-2xl font-bold mb-6">Trang tổng quan</h1>

        {/* Khu vực hiển thị tin tức mới nhất */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Tin tức mới nhất</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.length > 0 ? (
              news.map((item) => (
                <div key={item._id} className="bg-white rounded shadow p-4">
                  <h3 className="text-lg font-bold text-blue-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.summary}</p>
                  <p className="text-xs text-gray-500">
                    Ngày đăng: {item.date} | Nguồn: {item.source}
                  </p>
                </div>
              ))
            ) : (
              <p>Không có tin mới</p>
            )}
          </div>
        </section>

        {/* Khu vực hiển thị booking gần đây */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Đặt sân gần đây</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking._id} className="bg-white rounded shadow p-4">
                  <h3 className="text-lg font-bold text-blue-800 mb-2">
                    {booking.center?.name || 'Tên sân'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Khách: {booking.user?.username || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Thời gian: {booking.dateStart} - {booking.dateEnd}
                  </p>
                </div>
              ))
            ) : (
              <p>Không có đặt sân mới</p>
            )}
          </div>
        </section>

        {/* Khu vực hiển thị đánh giá gần đây */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Đánh giá gần đây</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ratings.length > 0 ? (
              ratings.map((rating) => (
                <div key={rating._id} className="bg-white rounded shadow p-4">
                  <h3 className="text-lg font-bold text-blue-800 mb-2">
                    Sân: {rating.center?.name || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Người đánh giá: {rating.user?.username || 'N/A'}
                  </p>
                  <p className="text-sm text-yellow-600">
                    Số sao: {rating.stars}
                  </p>
                  <p className="text-xs text-gray-500">{rating.comment}</p>
                </div>
              ))
            ) : (
              <p>Không có đánh giá mới</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
