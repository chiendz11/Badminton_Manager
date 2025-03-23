// src/pages/PaymentPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { clearAllPendingBookings, confirmBooking } from "../apis/booking";
import { getUserById } from "../apis/users";
import { Copy } from "lucide-react";
import SessionExpired from "./SessionExpired";
import BookingHeader from "../components/BookingHeader";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = new URLSearchParams(search);

  // Lấy các query parameter từ URL
  const userId = query.get("user") || "000000000000000000000001";
  const centerId = query.get("centerId") || "67ca6e3cfc964efa218ab7d7";
  const initialDate = query.get("date") || new Date().toISOString().split("T")[0];
  // Tổng tiền được truyền từ BookingSchedule
  const totalPrice = query.get("total") ? Number(query.get("total")) : 0;

  const [selectedDate] = useState(initialDate);
  const [userInfo, setUserInfo] = useState({ name: "", phone: "" });
  // timeLeft sẽ được tính dựa trên bookingExpiresAt (nếu có) hoặc fallback 300 giây
  const [timeLeft, setTimeLeft] = useState(300);
  const [showCopied, setShowCopied] = useState(false);
  const qrCode = "/images/Tiền.jpg"; // Đường dẫn QR code

  // Lấy thông tin user khi component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await getUserById(userId);
        if (user) {
          setUserInfo(user);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    fetchUserInfo();
  }, [userId]);

  // Clear pending bookings khi load
  useEffect(() => {
    const clearAll = async () => {
      try {
        await clearAllPendingBookings({ userId, centerId });
      } catch (error) {
        console.error("Error clearing pending bookings on mount:", error);
      }
    };
    clearAll();
  }, [userId, centerId]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    const getExpiresAt = () => {
      const expiresAtStr = localStorage.getItem("bookingExpiresAt");
      console.log("bookingExpiresAt from localStorage:", expiresAtStr);
      if (expiresAtStr) {
        return new Date(expiresAtStr).getTime();
      }
      return null;
    };

    const startCountdown = () => {
      const expiresAt = getExpiresAt();
      if (expiresAt) {
        const updateCountdown = () => {
          const now = Date.now();
          const remaining = Math.floor((expiresAt - now) / 1000);
          console.log("Updating countdown using expiresAt. Remaining seconds:", remaining);
          setTimeLeft(remaining > 0 ? remaining : 0);
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
      } else {
        const startTime = parseInt(localStorage.getItem("paymentStartTime"), 10) || Date.now();
        console.log("Using paymentStartTime for countdown. Start time:", startTime);
        const updateCountdown = () => {
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = 300 - elapsed;
          console.log("Updating countdown using paymentStartTime. Elapsed:", elapsed, "Remaining:", remaining);
          setTimeLeft(remaining > 0 ? remaining : 0);
        };
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
      }
    };

    const cleanup = startCountdown();
    return cleanup;
  }, []);

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("0982451906");
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  const handleConfirmOrder = async () => {
    try {
      // Gọi API xác nhận booking và truyền thêm totalPrice
      const { success } = await confirmBooking({
        userId,
        centerId,
        date: selectedDate,
        totalPrice
      });
      if (success) {
        alert("Đơn hàng của bạn đã được xác nhận (booked).");
        localStorage.removeItem("paymentStartTime");
        localStorage.removeItem("bookingExpiresAt");
        navigate("/");
      }
    } catch (error) {
      alert("Lỗi khi xác nhận booking: " + error.message);
    }
  };

  // Xử lý khi nhấn back (popstate)
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

  // Clear pending bookings khi component unmount
  useEffect(() => {
    return () => {
      clearAllPendingBookings({ userId, centerId })
        .then(() => {
          localStorage.removeItem("paymentStartTime");
        })
        .catch((err) => console.error("Error clearing pending bookings on unmount:", err));
    };
  }, [userId, centerId]);

  if (timeLeft === 0) {
    return <SessionExpired />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-green-800 text-white">
      {/* Header: dùng AppHeader với callback onBack */}
      <BookingHeader
        title="Payment"
        onBack={() => navigate("/")} // Khi nhấn mũi tên, về trang Home
      />

      {/* Nội dung chính */}
      <div className="flex flex-1 p-4 gap-4">
        {/* Cột trái: Thông tin thanh toán */}
        <div className="flex-1 flex flex-col gap-4 border-r border-white/50 pr-4">
          <div className="p-4 bg-green-800 flex gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-2" style={{ color: "#CEE86B" }}>
                1. Bank Account
              </h2>
              <p>
                Account name: <span className="font-semibold">BUI ANH CHIEN</span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <p>
                  Account number:{" "}
                  <span className="font-semibold">0982451906</span>
                </p>
                <div className="relative">
                  <button
                    onClick={handleCopyAccount}
                    className="bg-gray-200 hover:bg-gray-300 text-black px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Copy size={16} /> Copy
                  </button>
                  {showCopied && (
                    <div className="absolute top-full left-0 mt-1 text-green-600 text-sm bg-white px-2 py-1 rounded shadow">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
              <p>
                Bank name: <span className="font-semibold">MBBank</span>
              </p>
            </div>
            <div className="flex items-start justify-center">
              <img
                src={qrCode}
                alt="QR Code"
                className="border border-gray-300 w-32 h-32 object-contain rounded"
              />
            </div>
          </div>

          <div className="bg-green-800 text-white font-semibold rounded p-3 flex items-center gap-2">
            <span className="text-xl text-yellow-600">🚨</span>
            <span className="leading-tight">
              Please transfer{" "}
              <span className="text-yellow-200 font-bold">
                {totalPrice.toLocaleString("vi-VN")} đ
              </span>{" "}
              and send payment images in the boxes below to complete the booking!
            </span>
          </div>

          <p className="text-sm" style={{ color: "#CEE86B" }}>
            After transferring, please check your booking status in the "Account"
            tab until the owner confirms.
          </p>

          <div className="text-center">
            <p>Your booking will be reserved for</p>
            <h3 className="text-2xl font-bold mt-1">{formatTime(timeLeft)}</h3>
          </div>

          <div className="flex gap-4 justify-center">
            <div className="border-2 border-white rounded w-40 h-40 flex flex-col items-center justify-center text-center p-2">
              <p className="text-sm">Click to upload payment image (*)</p>
            </div>
            <div className="border-2 border-white rounded w-40 h-40 flex flex-col items-center justify-center text-center p-2">
              <p className="text-sm">Click to upload student/discount proof</p>
            </div>
          </div>

          <div className="mt-auto">
            <button
              onClick={handleConfirmOrder}
              className="bg-[#F1C40F] hover:bg-[#e1b70d] text-black font-bold w-full py-3 rounded text-lg"
            >
              CONFIRM BOOKING
            </button>
          </div>
        </div>

        {/* Cột phải: Thông tin booking */}
        <div className="w-80 h-1/2 bg-green-900 rounded p-4 flex flex-col gap-1">
          <p>
            <strong>Name:</strong> {userInfo.name || "Loading..."}
          </p>
          <p>
            <strong>Phone:</strong> {userInfo.phone || "Loading..."}
          </p>
          <p>
            <strong>Booking Code:</strong> #646
          </p>
          <p>
            <strong>Detail:</strong> {selectedDate} <br />
            {/* Các slot chi tiết có thể được thêm vào sau */}
          </p>
          <p>
            <strong>Total:</strong>{" "}
            <span className="text-yellow-300">
              {totalPrice.toLocaleString("vi-VN")} đ
            </span>
          </p>
          <p>
            <strong>Need payment:</strong>{" "}
            <span className="text-yellow-300">
              {totalPrice.toLocaleString("vi-VN")} đ
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
