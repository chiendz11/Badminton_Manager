// src/routes/bookingPendingRoutes.js
import express from "express";
import {
  togglePendingTimeslotController,
  pendingBookingToDBController,
  bookedBookingInDBController,
  clearAllPendingBookingsController,
  getPendingMappingController,
  checkPendingExistsController
} from "../controllers/bookingController.js";

const router = express.Router();

router.post("/pending/toggle", togglePendingTimeslotController);

router.post("/pending/pendingBookingToDB", pendingBookingToDBController);

router.post("/pending/bookedBookingInDB", bookedBookingInDBController);

// Endpoint để clear toàn bộ pending booking của user tại trung tâm
router.post("/pending/clear-all", clearAllPendingBookingsController);

router.get("/pending/mapping", getPendingMappingController);

router.get("/pending/exists", checkPendingExistsController);

export default router;
