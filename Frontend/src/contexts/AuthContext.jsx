// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { fetchUserInfo, logoutUser } from "../apis/users";
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Khi ứng dụng khởi chạy, gọi API lấy thông tin user từ cookie
  useEffect(() => {
    const getUser = async () => {
      try {
        const data =  await fetchUserInfo();
        console.log("[AuthContext] Kết quả fetch user:", data);
        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error in AuthContext fetching user info:", error);
      }
    };
    getUser();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutUser(); // Gọi API logout để xóa cookie trên server
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}x``
    </AuthContext.Provider>
  );
};
