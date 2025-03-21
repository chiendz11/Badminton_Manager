// src/components/ModalConfirmation.jsx
import React, { useState } from "react";

const ModalConfirmation = ({ onAction, totalAmount }) => {
  // State lưu offset của modal khi kéo
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // State lưu vị trí bắt đầu kéo
  const [dragStart, setDragStart] = useState(null);

  const handleMouseDown = (e) => {
    // Lưu vị trí ban đầu của chuột trừ đi offset hiện tại
    setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleMouseMove = (e) => {
    if (dragStart) {
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setDragOffset(newOffset);
    }
  };

  const handleMouseUp = () => {
    setDragStart(null);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50"></div>
      {/* Modal Content */}
      <div
        className="relative bg-green-700 rounded-lg p-6 w-11/12 max-w-md z-10 cursor-move select-none"
        onMouseDown={handleMouseDown}
        style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
      >
        {/* Nút đóng modal (X) */}
        <button
          onClick={() => onAction("edit")}
          className="absolute top-2 right-2 text-white font-bold text-xl hover:text-gray-300 transition"
          aria-label="Close Modal"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-white text-center">Xác nhận đặt sân</h2>
        <p className="mb-4 text-base text-white">
          Tổng tiền thanh toán là{" "}
          <span className="font-bold text-yellow-500">
            {totalAmount.toLocaleString("vi-VN")} đ
          </span>
          . Nếu bạn xác nhận thanh toán bạn sẽ có 5 phút để thanh toán
          (trong 5 phút đó không thể đặt sân tại trung tâm bạn vừa đặt nếu bạn thoát ra khỏi trang thanh toán, trừ khi bạn xóa thanh toán đó
          tại lịch sử thanh toán).
          Bạn có chắc chắn muốn thanh toán không?! <span role="img" aria-label="thinking">🧐</span>
        </p>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => onAction("edit")}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 transition"
          >
            Sửa lại
          </button>
          <button
            onClick={() => onAction("pay")}
            className="px-4 py-2 bg-yellow-300 text-black rounded hover:bg-yellow-400 transition"
          >
            Thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmation;
