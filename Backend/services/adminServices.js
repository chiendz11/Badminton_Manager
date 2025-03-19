// loginService.js
import Admin from '../models/admin.js';

export async function authenticateAdmin(username, password) {
  // Tìm admin theo username và role 'admin'
  const admin = await Admin.findOne({ username, role: 'admin' });
  if (!admin) return null;

  // So sánh mật khẩu (trong thực tế, dùng bcrypt để so sánh hash)
  if (admin.password !== password) return null;

  // Trả về thông tin admin (loại trừ password)
  const { _id, username: uname, role, avatar, centers, createdAt, updatedAt } = admin;
  return { _id, username: uname, role, avatar, centers, createdAt, updatedAt };
}
