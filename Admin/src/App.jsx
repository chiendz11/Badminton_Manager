import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Users from "@/pages/Users";
import Fields from "@/pages/Fields";

function App() {
  const isAuthenticated = false;  // Tạm thời đặt là false để kiểm tra

  return (
    <Router>
      <Routes>
        {/* Khi vào trang chủ "/", sẽ tự động chuyển hướng đến trang "/login" nếu chưa đăng nhập */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/fields" element={<Fields />} />
      </Routes>
    </Router>
  );
}

export default App;
