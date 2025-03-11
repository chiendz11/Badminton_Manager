import React from "react";

const DatePicker = ({ onDateChange }) => {
  // Lấy ngày hôm nay theo định dạng "YYYY-MM-DD"
  const today = new Date().toISOString().split("T")[0];
  
  return (
    <input
      type="date"
      defaultValue={today}
      onChange={(e) => {
        if (onDateChange) {
          onDateChange(e.target.value);
        }
      }}
    />
  );
};

export default DatePicker;
