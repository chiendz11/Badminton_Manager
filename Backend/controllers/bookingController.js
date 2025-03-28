// src/controllers/bookingPendingController.js
import {
  togglePendingTimeslotMemory,
  pendingBookingToDB,
  bookedBookingInDB,
  clearAllPendingBookings,
  getFullPendingMapping,
  createBillService,
  getBillService
} from "../services/bookingServices.js";
import Booking from "../models/bookings.js"; // Cho hàm checkPendingExists

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
    const { userId, centerId, date } = req.body;
    const booking = await pendingBookingToDB(userId, centerId, date);
    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error confirming booking to DB (Controller):", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const bookedBookingInDBController = async (req, res) => {
  try {
    const { userId, centerId, date, totalPrice } = req.body;
    const booking = await bookedBookingInDB(userId, centerId, date, totalPrice);
    res.json({ success: true, booking });
  } catch (error) {
    console.error("Error confirming booking in DB (Controller):", error);
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
    const { userId, centerId} = req.query;
    const exists = await Booking.findOne({
      userId,
      centerId,
      status: "pending"
    });
    res.json({ success: true, exists: !!exists });
  } catch (error) {
    console.error("Error checking pending booking existence (Controller):", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


export const createBillController = async (req, res) => {
  try {
    const { userId, centerId, bookingId, totalAmount, paymentImage } = req.body;
    const bill = await createBillService({ userId, centerId, bookingId, totalAmount, paymentImage });
    return res.status(201).json({ success: true, bill });
  } catch (error) {
    console.error("Error creating bill:", error);
    return res.status(500).json({ success: false, message: "Error creating bill" });
  }
};
export const getBillController = async (req, res) => {
  try {
    const { billId } = req.params;
    const bill = await getBillService(billId);
    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }
    return res.status(200).json({ success: true, bill });
  } catch (error) {
    console.error("Error getting bill:", error);
    return res.status(500).json({ success: false, message: "Error getting bill" });
  }
};