import React from 'react';
import { useNavigate } from 'react-router-dom';
import pic2 from '../image/pig2.jpg';

const Dashboard = () => {
  const navigate = useNavigate();

  const goToFields = () => navigate('/fields');
  const goToShop = () => navigate('/shop');  // Đảm bảo hàm này gọi /shop
  const goToUsers = () => navigate('/users');
  const goToStore = () => navigate('/store');
  const goToBill = () => navigate('/bill');

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${pic2})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Lớp overlay mờ trên ảnh nền */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Nội dung chính (đặt relative để nằm trên overlay) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="flex items-center space-x-4 p-4 sm:p-8">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black">
            avatar
          </div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold">
            Sân cầu lông DA
          </h1>
        </header>

        {/* Khung trắng chứa các ô chức năng */}
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl p-6 sm:p-8 rounded-xl shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Ô 1: Xem trạng thái sân -> Fields */}
              <div
                className="p-6 bg-pink-100 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={goToFields}
              >
                <h3 className="text-pink-600 font-semibold text-lg mb-3">
                  Xem trạng thái sân
                </h3>
                <div className="text-pink-700 text-2xl">icon1</div>
              </div>

              {/* Ô 2: Bán hàng -> Shop */}              
              <div
                className="p-6 bg-pink-200 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={goToShop}
              >
                <h3 className="text-pink-700 font-semibold text-lg mb-3">
                  Bán hàng
                </h3>
                <div className="text-pink-800 text-2xl">icon2</div>
              </div>

              {/* Ô 3: Quản lý khách hàng -> Users */}
              <div
                className="p-6 bg-green-200 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={goToUsers}
              >
                <h3 className="text-green-700 font-semibold text-lg mb-3">
                  Quản lý khách hàng
                </h3>
                <div className="text-green-800 text-2xl">icon6</div>
              </div>

              {/* Ô 4: Kho & dịch vụ -> Store */}
              <div
                className="p-6 bg-red-100 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={goToStore}
              >
                <h3 className="text-red-600 font-semibold text-lg mb-3">
                  Kho &amp; dịch vụ
                </h3>
                <div className="text-red-700 text-2xl">icon3</div>
              </div>

              {/* Ô 5: Quản lý đơn hàng -> Bill */}
              <div
                className="p-6 bg-blue-100 rounded-lg text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={goToBill}
              >
                <h3 className="text-blue-600 font-semibold text-lg mb-3">
                  Quản lý đơn hàng
                </h3>
                <div className="text-blue-700 text-2xl">icon7</div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
