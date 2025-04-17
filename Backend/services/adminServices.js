// services/loginService.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.js';

export async function authenticateAdmin(username, password) {
  try {
    // Tìm admin theo username
    const admin = await Admin.findOne({ username }).select('+password_hash');
    if (!admin) {
      throw new Error('Admin không tồn tại!');
    }

    // So sánh mật khẩu bằng bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      throw new Error('Sai username hoặc password!');
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: admin._id, type: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Trả về thông tin admin (loại trừ password_hash) và token
    const { _id, username: uname, avatar, centers, createdAt, updatedAt } = admin;
    return {
      admin: { _id, username: uname, avatar, centers, createdAt, updatedAt },
      token,
    };
  } catch (error) {
    console.error('Lỗi xác thực admin:', error);
    throw new Error(error.message || 'Lỗi khi xác thực admin');
  }
}