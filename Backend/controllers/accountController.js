// src/controllers/accountController.js
import { getAdminById, updateAdminAccount } from "../services/accountService.js";

/**
 * Controller để lấy thông tin tài khoản admin theo id.
 * API: GET /api/admin/:adminId
 */
export const getAdminAccount = async (req, res) => {
  try {
    const { adminId } = req.params;
    const admin = await getAdminById(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Không tìm thấy thông tin admin" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller để cập nhật tài khoản admin
 * API: PUT /api/admin/:adminId
 */
export const updateAdminAccountController = async (req, res) => {
  try {
    const { adminId } = req.params;
    const updateData = req.body;
    const updatedAdmin = await updateAdminAccount(adminId, updateData);
    if (!updatedAdmin) {
      return res.status(404).json({ message: "Không tìm thấy admin để cập nhật" });
    }
    res.status(200).json({ admin: updatedAdmin });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
