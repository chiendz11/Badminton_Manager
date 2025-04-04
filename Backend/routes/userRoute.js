import express from 'express';
import {insertRating, getDetailedBookingStatsController, getChartController, getUserInfoController, logoutController, updateUserController, updateUserPasswordController, registerUserController, loginUserController, forgotPasswordByEmailController

 } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.get("/me", protect, getUserInfoController);
// Endpoint logout (đã bảo vệ, vì chỉ user đã đăng nhập mới cần logout)
router.post("/logout", protect, logoutController);
router.put("/update", protect, updateUserController);
router.put("/change-password", protect, updateUserPasswordController);
router.get("/get-chart", protect, getChartController);
router.get("/detailed-stats", protect, getDetailedBookingStatsController);
router.post('/forgot-password-email', forgotPasswordByEmailController); // Route cho quên mật khẩu bằng email (đơn giản hóa)
router.post("/insert-ratings", protect, insertRating);




export default router;