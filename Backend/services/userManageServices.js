import User from "../models/users.js";

export const getAllUsersService = async () => {
  try {
    const users = await User.find({}).lean(); // Sử dụng .lean() để tối ưu hiệu suất
    if (!users || users.length === 0) {
      throw new Error("Không tìm thấy người dùng nào");
    }
    return users;
  } catch (error) {
    throw new Error(error.message || "Lỗi khi lấy danh sách người dùng");
  }
};

// Xóa người dùng theo ID
export const deleteUser = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw { success: false, message: 'Người dùng không tồn tại' };
    }
    const deleteResult = await User.deleteOne({ _id: id });
    if (deleteResult.deletedCount === 0) {
      throw { success: false, message: 'Không thể xóa người dùng vì không tìm thấy' };
    }
    return { success: true, message: 'Xóa người dùng thành công' };
  } catch (error) {
    throw { success: false, message: error.message || 'Lỗi khi xóa người dùng', error };
  }
};