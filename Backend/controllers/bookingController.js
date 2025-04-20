import {
  togglePendingTimeslotMemory,
  pendingBookingToDB,
  bookedBookingInDB,
  clearAllPendingBookings,
  getFullPendingMapping,
  getBookingImageService,
  cancelBookingService,
  getPopularTimeSlot,
  getBookingHistory,
  deleteBookingService
} from "../services/bookingServices.js";
import Booking from "../models/bookings.js";

export const togglePendingTimeslotController = async (req, res) => {
  try {
    const { userId, centerId, date, courtId, timeslot, ttl } = req.body;
    const booking = await togglePendingTimeslotMemory(userId, centerId, date, courtId, timeslot, ttl || 60);
    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error toggling pending timeslot (Controller):", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const pendingBookingToDBController = async (req, res) => {
  try {
    const { userId, centerId, date, totalAmount } = req.body;
    const name = req.user.name;
    const booking = await pendingBookingToDB(userId, centerId, date, totalAmount, name);
    console.log(name);
    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error confirming booking to DB (Controller):", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bookedBookingInDBController = async (req, res) => {
  try {
    const { userId, centerId, date, totalAmount, paymentImage, note } = req.body;
    const result = await bookedBookingInDB({
      userId,
      centerId,
      date,
      totalAmount,
      paymentImage,
      note
    });
    res.json({ success: true, booking: result.booking, totalPoints: result.totalPoints, pointsEarned: result.pointsEarned });
  } catch (error) {
    console.error("Lỗi khi xác nhận thanh toán booking (Controller):", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearAllPendingBookingsController = async (req, res) => {
  try {
    const { userId, centerId } = req.body;
    const result = await clearAllPendingBookings(userId, centerId);
    const currentDate = new Date().toISOString().split("T")[0];
    const mapping = await getFullPendingMapping(centerId, currentDate);
    if (global.io) {
      global.io.emit("updateBookings", { date: currentDate, mapping });
    }
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error clearing all pending bookings (Controller):", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPendingMappingController = async (req, res) => {
  try {
    const { centerId, date } = req.query;
    const mapping = await getFullPendingMapping(centerId, date);
    res.json({ success: true, mapping });
  } catch (error) {
    console.error("Error fetching pending mapping (Controller):", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const checkPendingExistsController = async (req, res) => { 
  try {
    const { userId, centerId } = req.query;
    const pendingBooking = await Booking.findOne({
      userId,
      centerId,
      status: "pending"
    });
    res.json({ 
      success: true, 
      exists: !!pendingBooking, 
      booking: pendingBooking 
    });
  } catch (error) {
    console.error("Error checking pending booking existence (Controller):", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getBookingImageController = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await getBookingImageService(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    return res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error("Error getting booking:", error);
    return res.status(500).json({ success: false, message: "Error getting booking" });
  }
};

export const cancelBookingController = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await cancelBookingService(userId);
    res.status(200).json({
      success: true,
      message: "Xóa booking pending thành công",
      ...result,
    });
  } catch (error) {
    console.error("Error in cancelBookingController:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPopularTimeSlotController = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await getPopularTimeSlot(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getPopularTimeSlotController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBookingHistoryController = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await getBookingHistory(userId);
    return res.status(200).json({ success: true, bookingHistory: history });
  } catch (error) {
    console.error("Error getting booking history:", error);
    return res.status(500).json({ success: false, message: error?.message || "Lỗi server" });
  }
};

export const deleteBookingController = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await deleteBookingService(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found or not in paid status" });
    }
    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error in deleteBookingController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};