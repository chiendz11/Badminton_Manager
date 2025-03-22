// src/components/SessionExpired.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BookingHeader from "../components/BookingHeader";

const SessionExpired = () => {
  const navigate = useNavigate();
  // Đường dẫn ảnh phiên hết hạn (bạn có thể điều chỉnh theo cấu trúc dự án)
  const expiredImagePath = "/images/TimeExpired.gif";

  // Khi nhấn back trên trình duyệt, điều hướng về trang chủ
  useEffect(() => {
    const handlePopState = () => {
      navigate("/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-green-800 text-white">
      {/* Header luôn nằm ở trên cùng */}
      <BookingHeader title="Thanh toán" onBack={() => navigate("/")} />
  
      {/* Nội dung chính, căn giữa theo chiều dọc và ngang */}
      <div className="flex flex-col items-center justify-center flex-1 p-4">
        {/* Hiển thị ảnh phiên hết hạn */}
        <img
          src={expiredImagePath}
          alt="Phiên đặt sân đã hết hạn"
          className="max-w-full mb-6"
        />
        <p className="mb-8 text-3xl text-center font-mono">
          Thời gian đặt sân của bạn đã hết hạn do chờ thanh toán quá lâu.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-yellow-300 text-black font-bold text-3xl rounded hover:bg-yellow-400 transition font-mono"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
};

export default SessionExpired;
