import React, { useState } from 'react';

const EditableInfoCard = ({ label, value, onConfirm }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleButtonClick = () => {
    if (isEditing) {
      // Khi nhấn xác nhận, gọi hàm onConfirm với giá trị mới
      onConfirm(tempValue);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className="info-card enhanced">
      <div className="info-label">{label}</div>
      <div className="info-value">
        {isEditing ? (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
          />
        ) : (
          value
        )}
      </div>
      <button
        className="edit-info-btn"
        title={isEditing ? "Xác nhận" : "Chỉnh sửa"}
        onClick={handleButtonClick}
      >
        <i className={`fas ${isEditing ? "fa-check" : "fa-pen"}`}></i>
      </button>
    </div>
  );
};

export default EditableInfoCard;
