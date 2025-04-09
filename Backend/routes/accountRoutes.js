// src/routes/accountRoutes.js
import express from "express";
import { getAdminAccount, updateAdminAccountController } from "../controllers/accountController.js";

const router = express.Router();

// Lấy thông tin admin theo adminId
router.get("/:adminId", getAdminAccount);

// Cập nhật thông tin admin theo adminId
router.put("/:adminId", updateAdminAccountController);

export default router;
