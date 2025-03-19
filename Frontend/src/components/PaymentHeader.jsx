import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa"; // Import icon mũi tên trái từ FontAwesome

const PaymentHeader = ({ title }) => {
  const navigate = useNavigate();
  return (
    <header className="relative h-16 flex items-center justify-center px-4 border-b border-[#CEE86B] flex-shrink-0">
      <button
        className="absolute left-4 text-white"
        onClick={() => navigate("/")}
      >
        <FaArrowLeft className="text-3xl font-bold" />
      </button>
      <h1 className="text-2xl font-bold" style={{ color: "#CEE86B" }}>
        {title}
      </h1>
    </header>
  );
};

export default PaymentHeader;
