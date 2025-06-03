// routes/adminRoutes.js
import express from "express";
import { protect, restrictToAdmin } from "../middleware/authMiddleware.js";
import { getAllUsers, deleteUserController } from "../controllers/userManageController.js";
import csrfConfig from '../middleware/csrfConfig.js';

const router = express.Router();
const csrfProtection = csrfConfig;

// Endpoint: Lấy tất cả người dùng
router.get("/get-all-users", protect, restrictToAdmin, getAllUsers);
router.delete('/delete-user', protect, restrictToAdmin, csrfProtection, deleteUserController);

export default router;