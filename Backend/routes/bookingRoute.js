// src/routes/bookingPendingRoutes.js
import express from "express";
import {
  togglePendingTimeslotController,
  pendingBookingToDBController,
  bookedBookingInDBController,
  clearAllPendingBookingsController,
  getPendingMappingController,
  checkPendingExistsController,
  getBookingImageController,
  cancelBookingController,
  getPopularTimeSlotController,
  getBookingHistoryController,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/getBillById", getBookingImageController);

router.post("/pending/toggle", togglePendingTimeslotController);

router.post("/pending/pendingBookingToDB", pendingBookingToDBController);

router.post("/pending/bookedBookingInDB", bookedBookingInDBController);

// Endpoint để clear toàn bộ pending booking của user tại trung tâm
router.post("/pending/clear-all", clearAllPendingBookingsController);

router.get("/pending/mapping", getPendingMappingController);

router.get("/pending/exists", checkPendingExistsController);
router.post("/cancel-booking", protect, cancelBookingController);
router.get("/popular-times", protect, getPopularTimeSlotController);
router.get("/get-booking-history", protect, getBookingHistoryController);

export default router;
