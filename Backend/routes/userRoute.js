import express from 'express';
import { registerUser, getUserById, loginUser, getUserInfoController, logoutController } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get("/getUsers", getUserById);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getUserInfoController);
// Endpoint logout (đã bảo vệ, vì chỉ user đã đăng nhập mới cần logout)
router.post("/logout", protect, logoutController);




export default router;