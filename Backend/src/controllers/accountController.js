import { updateAdminProfileService } from "../services/accountService.js";

export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id; // lấy từ middleware xác thực (ví dụ JWT)
    const { oldPassword, newPassword, avatar } = req.body;

    const updatedAdmin = await updateAdminProfileService(adminId, {
      oldPassword,
      newPassword,
      avatar,
    });

    res.json({
      message: "Cập nhật tài khoản thành công",
      admin: {
        id: updatedAdmin._id,
        username: updatedAdmin.username,
        avatar: updatedAdmin.avatar,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
