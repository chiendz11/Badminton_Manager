// src/components/Button.js
import React from 'react';
import './Button.css';  // Tùy chọn: nếu bạn muốn sử dụng CSS cho component này

function Button(props) {
  return (
    <button className="btn">{props.label}</button>
  );
}

export default Button;
