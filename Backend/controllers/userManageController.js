// controllers/adminController.js
import { getAllUsersService, deleteUser } from "../services/userManageServices.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error in getAllUsers controller:", error);
    res.status(error.message === "Không tìm thấy người dùng nào" ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUserController = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Thiếu tham số id' });
    }
    const result = await deleteUser(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.message === 'Người dùng không tồn tại' ? 404 : 500).json(error);
  }
};