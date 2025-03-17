// src/apis/bookingPending.js
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export const togglePendingTimeslot = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/api/booking/pending/toggle`, payload);
    return response.data;
  } catch (error) {
    console.error("Error toggling pending timeslot:", error.response?.data || error.message);
    throw error;
  }
};

export const getPendingMapping = async (centerId, date) => {
  try {
    const response = await axios.get(`${API_URL}/api/booking/pending/mapping`, {
      params: { centerId, date }
    });
    return response.data.mapping;
  } catch (error) {
    console.error("Error fetching pending mapping:", error.response?.data || error.message);
    throw error;
  }
};

export const confirmBookingToDB = async ({ userId, centerId, date }) => {
  try {
    const response = await axios.post(`${API_URL}/api/booking/pending/pendingBookingToDB`, {
      userId,
      centerId,
      date
    });
    return response.data;
  } catch (error) {
    console.error("Error confirming booking to DB:", error.response?.data || error.message);
    throw error;
  }
};

export const confirmBooking = async ({ userId, centerId, date }) => {
  try {
    const response = await axios.post(`${API_URL}/api/booking/pending/bookedBookingInDB`, {
      userId,
      centerId,
      date
    });
    return response.data;
  } catch (error) {
    console.error("Error confirming booking in DB:", error.response?.data || error.message);
    throw error;
  }
};

export const checkPendingExists = async ({ userId, centerId, date }) => {
  try {
    const response = await axios.get(`${API_URL}/api/booking/pending/exists`, {
      params: { userId, centerId, date }
    });
    return response.data;
  } catch (error) {
    console.error("Error checking pending booking existence:", error.response?.data || error.message);
    throw error;
  }
};

export const clearAllPendingBookings = async ({ userId, centerId }) => {
  try {
    const response = await axios.post(`${API_URL}/api/booking/pending/clear-all`, { userId, centerId });
    return response.data;
  } catch (error) {
    console.error("Error clearing all pending bookings:", error.response?.data || error.message);
    throw error;
  }
};