// src/api/bookingAPI.js
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

// Toggle pending timeslot (POST /api/booking/pending/toggle)
export const togglePendingTimeslot = async (data) => {
  // data cần bao gồm: userId, centerId, date, courtId, timeslot, ttl (tùy chọn)
  const response = await axios.post(`${API_URL}/api/booking/pending/toggle`, data);
  return response.data;
};

// Lưu pending booking vào DB (POST /api/booking/pending/pendingBookingToDB)
export const pendingBookingToDB = async (data) => {
  // data cần bao gồm: userId, centerId, date
  const response = await axios.post(`${API_URL}/api/booking/pending/pendingBookingToDB`, data);
  return response.data;
};

// Chuyển pending booking thành booked trong DB (POST /api/booking/pending/bookedBookingInDB)
export const bookedBookingInDB = async (data) => {
  // data cần bao gồm: userId, centerId, date
  const response = await axios.post(`${API_URL}/api/booking/pending/bookedBookingInDB`, data);
  return response.data;
};

// Xóa toàn bộ pending booking của user tại trung tâm (POST /api/booking/pending/clear-all)
export const clearAllPendingBookings = async (data) => {
  // data cần bao gồm: userId, centerId
  const response = await axios.post(`${API_URL}/api/booking/pending/clear-all`, data);
  return response.data;
};

// Lấy mapping pending booking (GET /api/booking/pending/mapping)
// Truyền query params: centerId, date
export const getPendingMapping = async (params) => {
  const response = await axios.get(`${API_URL}/api/booking/pending/mapping`, { params });
  return response.data;
};

// Kiểm tra tồn tại pending booking (GET /api/booking/pending/exists)
// Truyền query params: userId, centerId, date
export const checkPendingExists = async (params) => {
  const response = await axios.get(`${API_URL}/api/booking/pending/exists`, { params });
  return response.data;
};
