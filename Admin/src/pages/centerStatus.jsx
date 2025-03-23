import React, { useState, useEffect } from "react";
import BookingTable from "../components/BookingTable"; 
import { getBookingDataForThu } from "../apis/admin"; 
import Center from "../../../Backend/models/centers";
// Giả sử hàm này trả về dữ liệu bookingData cho 1 thứ

const times = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
const slotCount = times.length - 1;

const weekdays = ["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","Chủ nhật"];

function CenterStatus() {
  const [courts, setCourts] = useState([]);
  const [allBookingData, setAllBookingData] = useState({}); 
  // allBookingData sẽ có dạng { "Thứ 2": {...}, "Thứ 3": {...}, ... }

  useEffect(() => {
    // 1. Gọi API lấy danh sách sân (tùy backend)
    async function fetchCourts() {
      try {
        const response = await fetch("/api/courts");
        const data = await response.json();
        setCourts(data); // data: [{_id, name},...]
      } catch (err) {
        console.error("Error fetch courts:", err);
      }
    }
    fetchCourts();
  }, []);

  useEffect(() => {
    // 2. Gọi API lấy bookingData cho từng thứ
    async function fetchAllBookingData() {
      if (courts.length === 0) return; 
      const temp = {};
      for (let thu of weekdays) {
        // getBookingDataForThu(thu) => trả về 1 object bookingData 
        // dạng { courtId1: [...], courtId2: [...], ...}
        const data = await getBookingDataForThu(thu);
        temp[thu] = data; 
      }
      setAllBookingData(temp);
    }
    fetchAllBookingData();
  }, [courts]);

  return (
    <div className="min-h-screen w-full p-4 bg-green-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Quản lý đặt sân (theo Thứ)</h1>

      {/* Container để cuộn ngang nếu 7 bảng quá rộng */}
      <div className="flex gap-4 overflow-x-auto">
        {weekdays.map((thu) => {
          const bookingData = allBookingData[thu] || {}; 
          return (
            <div 
              key={thu} 
              className="min-w-[600px] bg-white text-black p-3 rounded"
            >
              <h2 className="text-center font-bold mb-2 text-xl">
                {thu}
              </h2>
              <BookingTable
                courts={courts}
                bookingData={bookingData}
                times={times}
                slotCount={slotCount}
                // Ở phiên bản admin: 
                // - Chỉ hiển thị 2 trạng thái "booked" (đã đặt) & "pending" (đang chờ)
                // - Hoặc theo logic code trong component BookingTable.
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CenterStatus;
