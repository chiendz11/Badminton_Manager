// src/pages/PaymentPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "../components/datepicker";
import { clearAllPendingBookings, confirmBooking } from "../apis/booking";

const PaymentPage = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = new URLSearchParams(search);

  // Lấy thông tin từ URL
  const userId = query.get("user") || "000000000000000000000001";
  const centerId = query.get("centerId") || "67ca6e3cfc964efa218ab7d7";
  // Nếu không có giá trị date trong URL, mặc định lấy ngày hôm nay
  const initialDate = query.get("date") || new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const TTL = 300; // 5 phút
  const [timeLeft, setTimeLeft] = useState(TTL);

  // Khi trang load (F5) hoặc mount, clear toàn bộ pending booking của user tại trung tâm
  useEffect(() => {
    const clearAll = async () => {
      try {
        await clearAllPendingBookings({ userId, centerId });
        console.log("Cleared all pending bookings on mount");
      } catch (error) {
        console.error("Error clearing all pending bookings on mount:", error);
      }
    };
    clearAll();
  }, [userId, centerId]);

  // Đồng hồ đếm ngược: Lấy thời gian bắt đầu nếu chưa có
  useEffect(() => {
    if (!localStorage.getItem("paymentStartTime")) {
      localStorage.setItem("paymentStartTime", Date.now());
    }
  }, []);

  // Đồng hồ đếm ngược: Cập nhật mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      const startTime = parseInt(localStorage.getItem("paymentStartTime"), 10) || Date.now();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = TTL - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [TTL]);

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Nếu người dùng thay đổi ngày qua DatePicker, cập nhật selectedDate
  const handleDateChange = (newDate) => {
    console.log("DatePicker selected date:", newDate);
    setSelectedDate(newDate);
    // Khi đổi ngày, cũng xóa toàn bộ cache pending
    clearAllPendingBookings({ userId, centerId })
      .then(() => console.log("Cleared all pending bookings on date change"))
      .catch((error) => console.error("Error clearing pending bookings on date change:", error));
  };

  // Xác nhận booking: gọi API confirmBooking với userId, centerId và selectedDate
  const handleConfirmOrder = async () => {
    try {
      const { success } = await confirmBooking({ userId, centerId, date: selectedDate });
      if (success) {
        alert("Đơn hàng của bạn đã được xác nhận (booked).");
        localStorage.removeItem("paymentStartTime");
        navigate("/");
      }
    } catch (error) {
      alert("Lỗi khi xác nhận booking: " + error.message);
    }
  };

  // Xử lý khi nhấn back (popstate): Clear toàn bộ pending booking và điều hướng về Home
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      clearAllPendingBookings({ userId, centerId })
        .then(() => {
          localStorage.removeItem("paymentStartTime");
          navigate("/");
        })
        .catch((err) => {
          console.error("Error clearing pending bookings on back button:", err);
          navigate("/");
        });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, userId, centerId]);

  // Khi component unmount, Clear toàn bộ pending booking
  useEffect(() => {
    return () => {
      clearAllPendingBookings({ userId, centerId })
        .then(() => localStorage.removeItem("paymentStartTime"))
        .catch((err) => console.error("Error clearing pending bookings on unmount:", err));
    };
  }, [userId, centerId]);

  return (
    <div className="min-h-screen w-screen bg-green-900 text-white p-4 flex flex-col items-center">
      <div className="text-center text-2xl font-bold mb-4">Thanh toán</div>
      <div className="bg-green-700 p-6 rounded-lg max-w-4xl w-full flex flex-col md:flex-row justify-between">
        <div className="bg-white text-black p-4 rounded md:w-1/2">
          <h2 className="text-lg font-bold mb-2">1. Tài khoản ngân hàng</h2>
          <p>Tên TK: CHU THANH MINH</p>
          <p>Số TK: 0123456789</p>
          <p>Ngân hàng: MB Bank</p>
          <hr className="my-2" />
          <p className="text-red-600 font-bold">
            Chuyển khoản 225.000 đ, ghi "Thanh toán booking".
          </p>
          <p className="mt-2">Sau khi chuyển, nhấn "Xác nhận đặt".</p>
          <div className="bg-gray-200 p-2 mt-2">
            Booking còn giữ chỗ:{" "}
            <span className="text-red-500 font-bold ml-2">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="bg-white text-black p-4 rounded md:w-1/2 flex flex-col items-center">
          <img
            src="https://via.placeholder.com/150?text=QR+Code"
            alt="QR code"
            className="border border-gray-300"
          />
          <div className="text-sm font-bold text-center mt-2">
            <p>SP001 - 2h (Pickleball 18-20)</p>
            <p>SP002 - 1h (Badminton 8-9)</p>
            <p>Tổng thanh toán: 225.000 đ</p>
          </div>
        </div>
      </div>

      {/* Cho phép người dùng thay đổi ngày thanh toán qua DatePicker */}
      <div className="mt-4">
        <label className="text-lg font-bold">Chọn ngày thanh toán:</label>
        <DatePicker value={selectedDate} onDateChange={handleDateChange} />
      </div>

      <div className="mt-4">
        <button
          onClick={handleConfirmOrder}
          className="bg-yellow-500 text-black font-bold px-6 py-2 rounded hover:bg-yellow-600"
        >
          Xác nhận đặt
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
