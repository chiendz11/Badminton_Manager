// src/services/accountService.js
import Admin from "../models/admin.js";

/**
 * Lấy thông tin admin theo id
 * @param {String} adminId
 * @returns {Promise<Object>} Admin
 */
export const getAdminById = async (adminId) => {
  return await Admin.findById(adminId);
};

/**
 * Cập nhật thông tin admin theo id
 * @param {String} adminId
 * @param {Object} updateData Dữ liệu cập nhật (ví dụ: { username, avatar })
 * @returns {Promise<Object>} Admin sau khi cập nhật
 */
export const updateAdminAccount = async (adminId, updateData) => {
  // Cập nhật trường updatedAt nếu cần (timestamps tự động cập nhật nếu bạn enable trong Schema)
  const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updateData, {
    new: true, // trả về admin sau khi update
    runValidators: true,
  });
  return updatedAdmin;
};
