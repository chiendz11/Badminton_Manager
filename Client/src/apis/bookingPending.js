// apis/bookingPending.js
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
