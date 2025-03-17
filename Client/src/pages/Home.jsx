// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket";
import { checkPendingExists } from "../apis/bookingPending";

const Home = () => {
  const navigate = useNavigate();
  // Ví dụ: 2 userId để test realtime
  const userA = "000000000000000000000001";
  const userB = "000000000000000000000002";
  const centerId = "67ca6e3cfc964efa218ab7d7"; // Trung tâm hiện tại
  const today = new Date().toISOString().split("T")[0];

  const [pendingMapping, setPendingMapping] = useState({});

  // Hàm kiểm tra và điều hướng cho user được chọn
  const goToBooking = async (userId) => {
    try {
      const { exists } = await checkPendingExists({ userId, centerId, date: today });
      if (exists) {
        alert(`User ${userId} đã có booking pending cho trung tâm này. Vui lòng chờ hết 5 phút.`);
      } else {
        // Điều hướng sang BookingSchedule với các query parameters
        navigate(`/booking?user=${userId}&centerId=${centerId}&date=${today}`);
      }
    } catch (error) {
      alert("Lỗi kiểm tra booking pending: " + error.message);
    }
  };

  // Lắng nghe socket để nhận realtime pending mapping
  useEffect(() => {
    const handleUpdateBookings = (data) => {
      console.log("Home received updateBookings:", data);
      setPendingMapping(data);
    };

    socket.on("updateBookings", handleUpdateBookings);
    return () => {
      socket.off("updateBookings", handleUpdateBookings);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-green-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8">Home</h1>
      <div className="flex flex-col gap-4 mb-8">
        <button
          onClick={() => goToBooking(userA)}
          className="bg-blue-500 text-white font-bold px-6 py-3 rounded hover:bg-blue-600"
        >
          User A: Đi đến Đặt Sân
        </button>
        <button
          onClick={() => goToBooking(userB)}
          className="bg-purple-500 text-white font-bold px-6 py-3 rounded hover:bg-purple-600"
        >
          User B: Đi đến Đặt Sân
        </button>
      </div>
      <div className="bg-gray-800 p-4 rounded w-full max-w-lg">
        <h2 className="text-xl mb-2">Realtime Pending Mapping</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(pendingMapping, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default Home;
