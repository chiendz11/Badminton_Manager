import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Fields from '@/pages/Fields';
import Shop from '@/pages/Shop';      // Import Shop component
import Users from '@/pages/Users';


function App() {
  const isAuthenticated = false;  // Thay đổi theo logic xác thực thực tế

  return (
    <Router>
      <Routes>
        {/* Chuyển hướng trang chủ tùy thuộc vào trạng thái đăng nhập */} 
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />        
        <Route path="/fields" element={<Fields />} />        
        <Route path="/shop" element={<Shop />} />    
        <Route path="/users" element={<Users />} />               
      </Routes>
    </Router>
  );
}

export default App;
