import React from "react";

const BookingSchedule = () => {
  return (
    <div className="min-h-screen bg-green-900 text-white p-4">
      <div className="text-center text-xl font-bold">Đặt lịch ngày trực quan</div>
      
      <div className="bg-white text-black mt-4 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-white border border-black"></span>
              <span>Trống</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-red-500"></span>
              <span>Đã đặt</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 bg-gray-500"></span>
              <span>Khóa</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <input type="date" className="border p-2 rounded" />
            <button className="text-green-700">Xem sân & bảng giá</button>
          </div>
        </div>

        <p className="text-red-500 mt-2">
          Lưu ý: Nếu bạn cần đặt lịch cố định vui lòng liên hệ: 0392.836.933 hoặc 0333.691.947 để được hỗ trợ.
        </p>
      </div>

      <div className="overflow-auto mt-4 bg-green-100 p-4 rounded-md">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Sân</th>
              {Array.from({ length: 18 }, (_, i) => (
                <th key={i} className="border p-2">{5 + i}:00</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {["Tennis 1", "B.Đá sân", "B.Đá 7.1", "Pickleball 1", "Pickleball 2"].map((court, i) => (
              <tr key={i}>
                <td className="border p-2 bg-green-200">{court}</td>
                {Array.from({ length: 18 }, (_, j) => (
                  <td key={j} className="border p-2 bg-gray-500"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="border rounded-full p-2 flex items-center">
          <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
          <input type="range" className="w-40" />
        </div>
        <button className="bg-yellow-500 text-white px-6 py-2 rounded-md">TIẾP THEO</button>
      </div>
    </div>
  );
};

export default BookingSchedule;