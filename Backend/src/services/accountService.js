import bcrypt from "bcryptjs";
import Admin from "../models/admin.js";

export const updateAdminProfileService = async (adminId, { oldPassword, newPassword, avatar }) => {
  const admin = await Admin.findById(adminId);
  if (!admin) throw new Error("Admin không tồn tại");

  // Nếu cần đổi mật khẩu
  if (oldPassword && newPassword) {
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) throw new Error("Mật khẩu cũ không chính xác");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
  }

  // Nếu cần cập nhật avatar
  if (avatar) {
    admin.avatar = avatar;
  }

  await admin.save();
  return admin;
};
