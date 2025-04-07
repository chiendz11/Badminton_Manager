import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import CentersManagement from '@/pages/CentersManagement';
import Shop from '@/pages/Shop';
import Users from '@/pages/Users';
import BookingsManagement from '@/pages/BookingsManagement';
import News from '@/pages/News';
import Rating from '@/pages/Rating';
import Account from '@/pages/Account';


function App() {
  const isAuthenticated = false;  // Thay đổi theo logic xác thực thực tế

  return (
    <Router>
      <Routes>
        {/* Chuyển hướng trang chủ tùy thuộc vào trạng thái đăng nhập */} 
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />        
        <Route path="/centersmanagement" element={<CentersManagement />} />        
        <Route path="/shop" element={<Shop />} />    
        <Route path="/users" element={<Users />} />        
        <Route path="/bookingsmanagement" element={<BookingsManagement />} />  
        <Route path="/news" element={<News />} /> 
        <Route path="/ratings" element={<Rating />} /> 
        <Route path="/account" element={<Account />} /> 
      
      </Routes>
    </Router>
  );
}

export default App;
