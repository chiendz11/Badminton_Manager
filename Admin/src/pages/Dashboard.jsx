import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-6 space-y-4">
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-2xl font-bold mb-4">Thống kê</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-100 rounded-lg text-center">
            <h3 className="text-lg font-semibold">Tổng số người dùng</h3>
            <p className="text-3xl font-bold text-blue-600">150</p>
          </div>
          <div className="p-4 bg-green-100 rounded-lg text-center">
            <h3 className="text-lg font-semibold">Tổng số sân đã đặt</h3>
            <p className="text-3xl font-bold text-green-600">320</p>
          </div>
          <div className="p-4 bg-red-100 rounded-lg text-center">
            <h3 className="text-lg font-semibold">Doanh thu hôm nay</h3>
            <p className="text-3xl font-bold text-red-600">2,500,000 VNĐ</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-2xl font-bold mb-4">Lịch sử đặt sân gần đây</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="border-b-2 p-2">Người dùng</th>
              <th className="border-b-2 p-2">Sân</th>
              <th className="border-b-2 p-2">Thời gian</th>
              <th className="border-b-2 p-2">Tình trạng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-b p-2">Nguyen Van A</td>
              <td className="border-b p-2">Sân 1</td>
              <td className="border-b p-2">10:00 - 11:00</td>
              <td className="border-b p-2 text-green-600">Đã hoàn thành</td>
            </tr>
            <tr>
              <td className="border-b p-2">Tran Thi B</td>
              <td className="border-b p-2">Sân 3</td>
              <td className="border-b p-2">11:00 - 12:00</td>
              <td className="border-b p-2 text-yellow-600">Đang chờ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;


