import express from "express";
import {
  togglePendingTimeslotController,
  pendingBookingToDBController,
  bookedBookingInDBController,
  clearAllPendingBookingsController,
  getPendingMappingController,
  getMyPendingTimeslotsController,
  checkPendingExistsController,
  cancelBookingController,
  getPopularTimeSlotController,
  getBookingHistoryController,
  deleteBookingController,
} from "../controllers/bookingController.js";
import { protect, restrictToClient } from "../middleware/authMiddleware.js";
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

router.post("/pending/toggle", protect, restrictToClient, csrfProtection, togglePendingTimeslotController);

router.post("/pending/pendingBookingToDB", protect, restrictToClient, csrfProtection, pendingBookingToDBController);

router.post("/pending/bookedBookingInDB", protect, restrictToClient, csrfProtection, bookedBookingInDBController);

// Endpoint để clear toàn bộ pending booking của user tại trung tâm
router.post("/pending/clear-all", protect, restrictToClient, csrfProtection, clearAllPendingBookingsController);

router.get("/pending/mapping", protect, restrictToClient, getPendingMappingController);

router.get("/pending/my-timeslots", protect, restrictToClient, getMyPendingTimeslotsController);

router.get("/pending/exists", protect, restrictToClient, checkPendingExistsController);

router.post("/cancel-booking", protect, restrictToClient, csrfProtection, cancelBookingController);

router.get("/popular-times", protect, restrictToClient, getPopularTimeSlotController);

router.get("/get-booking-history", protect, restrictToClient, getBookingHistoryController);

router.post("/delete-booking", protect, restrictToClient, csrfProtection, deleteBookingController);

export default router;