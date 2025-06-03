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
  resetPasswordController,
} from "../controllers/userController.js";
import { protect, restrictToClient } from "../middleware/authMiddleware.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";

import { loginRateLimiter } from '../middleware/rateLimitMiddleware.js';
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

// Các route không yêu cầu đăng nhập và không cần CSRF
router.post("/forgot-password-email", forgotPasswordByEmailController);
router.post("/reset-password/:token/:userId", resetPasswordController);

// Các route không yêu cầu đăng nhập
router.post("/register", registerUserController);
router.post("/login", loginUserController); // Thêm loginRateLimiter

// Các route yêu cầu đăng nhập và chỉ dành cho client
router.get("/me", protect, restrictToClient, getUserInfoController);
router.post("/logout", protect, restrictToClient, csrfProtection, logoutController);
router.put("/update", protect, restrictToClient, uploadMiddleware, csrfProtection, updateUserController);
router.put("/change-password", protect, restrictToClient, csrfProtection, updateUserPasswordController);
router.get("/get-chart", protect, restrictToClient, getChartController);
router.get("/detailed-stats", protect, restrictToClient, getDetailedBookingStatsController);
router.post("/insert-ratings", protect, restrictToClient, csrfProtection, insertRating);

export default router;