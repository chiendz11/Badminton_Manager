// Legend.jsx
import React from "react";

const Legend = () => (
  <div className="flex space-x-4">
    <div className="flex items-center space-x-2">
      <span className="w-4 h-4 bg-white border border-black" />
      <span>Trống</span>
    </div>
    <div className="flex items-center space-x-2">
      <span className="w-4 h-4 bg-yellow-500" />
      <span>Pending (User khác)</span>
    </div>
    <div className="flex items-center space-x-2">
      <span className="w-4 h-4 bg-red-500" />
      <span>Đã đặt</span>
    </div>
  </div>
);

export default Legend;