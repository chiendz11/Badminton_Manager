// src/routes/bookingPendingRoutes.js
import express from "express";
import {
  togglePendingTimeslotController,
  pendingBookingToDBController,
  bookedBookingInDBController,
  clearAllPendingBookingsController,
  getPendingMappingController,
  checkPendingExistsController,
  cancelBookingController,
  getPopularTimeSlotController,
  getBookingHistoryController,
  deleteBookingController,
} from "../controllers/bookingController.js";
import { protect, restrictToClient } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/pending/toggle", protect, restrictToClient, togglePendingTimeslotController);

router.post("/pending/pendingBookingToDB", protect, restrictToClient, pendingBookingToDBController);

router.post("/pending/bookedBookingInDB",protect, restrictToClient, bookedBookingInDBController);

// Endpoint để clear toàn bộ pending booking của user tại trung tâm
router.post("/pending/clear-all", protect, restrictToClient, clearAllPendingBookingsController);

router.get("/pending/mapping",protect, restrictToClient, getPendingMappingController);

router.get("/pending/exists", protect,restrictToClient, checkPendingExistsController);
router.post("/cancel-booking", protect, restrictToClient, cancelBookingController);
router.get("/popular-times", protect, restrictToClient, getPopularTimeSlotController);
router.get("/get-booking-history", protect, restrictToClient, getBookingHistoryController);
router.post("/delete-booking", protect, restrictToClient, deleteBookingController);

export default router;
