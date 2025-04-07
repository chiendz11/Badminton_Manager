import Admin from '../models/admin.js';

const getAdminById = async (id) => {
  // Nếu cần, populate các trường liên quan (ví dụ centers)
  return await Admin.findById(id).populate('centers');
};

const updateAdminAccount = async (id, data) => {
  // Ngăn chặn thay đổi trường role (admin chỉ có role "admin")
  if (data.role) {
    delete data.role;
  }
  // Nếu cập nhật password, bạn có thể thêm xử lý hash ở đây (nếu cần)
  return await Admin.findByIdAndUpdate(id, data, { new: true });
};

export default {
  getAdminById,
  updateAdminAccount,
};
