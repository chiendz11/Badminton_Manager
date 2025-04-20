import express from "express";
import {
  insertRating,
  getDetailedBookingStatsController,
  getChartController,
  getUserInfoController,
  logoutController,
  updateUserController,
  updateUserPasswordController,
  registerUserController,
  loginUserController,
  forgotPasswordByEmailController,
} from "../controllers/userController.js";
import { protect, restrictToClient } from "../middleware/authMiddleware.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Các route không yêu cầu đăng nhập
router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/forgot-password-email", forgotPasswordByEmailController);

// Các route yêu cầu đăng nhập và chỉ dành cho client
router.get("/me", protect, restrictToClient, getUserInfoController);
router.post("/logout", protect, restrictToClient, logoutController);
router.put("/update", protect, restrictToClient, uploadMiddleware, updateUserController);
router.put("/change-password", protect, restrictToClient, updateUserPasswordController);
router.get("/get-chart", protect, restrictToClient, getChartController);
router.get("/detailed-stats", protect, restrictToClient, getDetailedBookingStatsController);
router.post("/insert-ratings", protect, restrictToClient, insertRating);

export default router;