// routes/adminRoutes.js
import express from "express";
import { protect, restrictToAdmin } from "../middleware/authMiddleware.js";
import { getAllUsers, deleteUserController } from "../controllers/userManageController.js";

const router = express.Router();

// Endpoint: Lấy tất cả người dùng
router.get("/get-all-users", protect, restrictToAdmin, getAllUsers);
router.delete('/delete-user', protect, restrictToAdmin, deleteUserController);

export default router;