import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllNews } from '../apis/newsAPI.js';
import { getAllRatings } from '../apis/ratingAPI.js';
import { getPendingMapping } from '../apis/bookingsAPI.js';
import AdminLayout from '../components/AdminLayout.jsx';
import { Home, Users, MapPin, Calendar, CreditCard, Star, User, LogOut, ShoppingBag } from 'lucide-react';


// Sub-components for content cards
const NewsCard = ({ data }) => (
  <div className="bg-white group rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{data.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{data.summary}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{data.date}</span>
        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md">{data.source}</span>
      </div>
    </div>
  </div>
);

const BookingCard = ({ data }) => (
  <div className="bg-white group rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="p-6">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{data.center?.name || 'Tên sân'}</h3>
        <span className="bg-green-100 text-green-600 px-2 py-1 rounded-md text-xs">Mới</span>
      </div>
      <div className="space-y-2 text-sm">
        <p className="flex items-center gap-2 text-gray-600">
          <span className="inline-block"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.387 0 4.63.59 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></span>
          {data.user?.username || 'N/A'}
        </p>
        <p className="flex items-center gap-2 text-gray-600">
          <span className="inline-block"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-4 18h.01M12 10v4m-6 4h12" /></svg></span>
          {data.dateStart} - {data.dateEnd}
        </p>
      </div>
    </div>
  </div>
);

const RatingCard = ({ data }) => (
  <div className="bg-white group rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{data.center?.name || 'N/A'}</h3>
          <p className="text-sm text-gray-500">{data.user?.username || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-1 text-yellow-500">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill={i < data.stars ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.286 7.033a1 1 0 00.95.69h7.388c.969 0 1.371 1.24.588 1.81l-5.976 4.345a1 1 0 00-.364 1.118l2.286 7.033c.3.921-.755 1.688-1.54 1.118l-5.976-4.345a1 1 0 00-1.176 0l-5.976 4.345c-.784.57-1.838-.197-1.54-1.118l2.286-7.033a1 1 0 00-.364-1.118L2.05 12.46c-.783-.57-.38-1.81.588-1.81h7.388a1 1 0 00.95-.69l2.286-7.033z" />
            </svg>
          ))}
        </div>
      </div>
      <p className="text-gray-600 text-sm line-clamp-2">{data.comment}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsData, bookingResponse, ratingData] = await Promise.all([
          getAllNews(),
          getPendingMapping(),
          getAllRatings()
        ]);

        setNews(Array.isArray(newsData) ? newsData.slice(0, 3) : []);
        setBookings(Array.isArray(bookingResponse?.bookings) ? bookingResponse.bookings.slice(0, 3) : []);
        setRatings(Array.isArray(ratingData) ? ratingData.slice(0, 3) : []);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <AdminLayout>
      {/* Main Content */}
      <div>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Trang tổng quan</h1>
            <p className="text-gray-500 mt-1">Cập nhật mới nhất từ hệ thống</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
          </div>
        </header>

        {[
          { title: 'Tin tức mới nhất', data: news, component: NewsCard },
          { title: 'Đặt sân gần đây', data: bookings, component: BookingCard },
          { title: 'Đánh giá gần đây', data: ratings, component: RatingCard },
        ].map((section, index) => (
          <section key={index} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-600 rounded-full" />
                {section.title}
              </h2>
              <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
                Xem tất cả
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {section.data.length > 0 ? (
                section.data.map((item) => (
                  <section.component key={item._id} data={item} />
                ))
              ) : (
                <div className="col-span-full bg-white p-6 rounded-xl shadow-sm">
                  <p className="text-gray-500 text-center">Không có dữ liệu</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
