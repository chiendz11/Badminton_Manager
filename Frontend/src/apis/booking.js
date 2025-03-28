// src/apis/bookingPending.js
import axiosInstance from "../config/axiosConfig";

export const togglePendingTimeslot = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/booking/pending/toggle", payload);
    return response.data;
  } catch (error) {
    console.error("Error toggling pending timeslot:", error.response?.data || error.message);
    throw error;
  }
};

export const getPendingMapping = async (centerId, date) => {
  try {
    const response = await axiosInstance.get("/api/booking/pending/mapping", {
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
    const response = await axiosInstance.post("/api/booking/pending/pendingBookingToDB", {
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


export const confirmBooking = async ({ userId, centerId, date, totalPrice, note }) => {
  try {
    const response = await axiosInstance.post("/api/booking/pending/bookedBookingInDB", {
      userId,
      centerId,
      date,
      totalPrice,
      note, // Thêm note ở đây
    });
    return response.data;
  } catch (error) {
    console.error("Error confirming booking in DB:", error.response?.data || error.message);
    throw error;
  }
};

export const checkPendingExists = async ({ userId, centerId }) => {
  try {
    const response = await axiosInstance.get("/api/booking/pending/exists", {
      params: { userId, centerId }
    });
    return response.data;
  } catch (error) {
    console.error("Error checking pending booking existence:", error.response?.data || error.message);
    throw error;
  }
};

export const clearAllPendingBookings = async ({ userId, centerId }) => {
  try {
    const response = await axiosInstance.post("/api/booking/pending/clear-all", { userId, centerId });
    return response.data;
  } catch (error) {
    console.error("Error clearing all pending bookings:", error.response?.data || error.message);
    throw error;
  }
};

// Giả sử backend bạn có endpoint POST /api/bills
export const createBill = async (payload) => {
  // payload có thể gồm userId, centerId, bookingId, totalAmount, paymentImage (base64) ...
  try {
    const { data } = await axiosInstance.post("/api/booking/bills", payload);
    return data; // { success: true, bill: {...} }
  } catch (error) {
    console.error("Error creating bill:", error.response?.data || error.message);
    throw error;
  }
};
