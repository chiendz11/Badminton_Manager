// src/components/SessionExpired.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import BookingHeader from "../components/BookingHeader";

const SessionExpired = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex flex-col bg-green-800 text-white">
      {/* Header luôn nằm ở trên cùng */}
      <BookingHeader title="Payment" />

      {/* Nội dung chính, căn giữa theo chiều dọc và ngang */}
      <div className="flex flex-col items-center justify-center flex-1 p-4">
        <h1 className="text-3xl font-bold mb-4">Phiên đặt sân đã hết hạn</h1>
        <p className="mb-8 text-lg">
          Thời gian đặt sân của bạn đã hết hạn do chờ thanh toán quá lâu.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-yellow-300 text-black font-bold rounded hover:bg-yellow-400 transition"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
};

export default SessionExpired;
