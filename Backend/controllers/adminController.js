// adminController.js
import { authenticateAdmin } from '../services/adminServices.js';

/**
 * Controller xử lý đăng nhập admin.
 * Nhận username và password từ req.body.
 * Nếu hợp lệ, trả về thông tin admin.
 */
export async function loginAdmin(req, res, next) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const adminData = await authenticateAdmin(username, password);
    
    if (!adminData) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json(adminData);
  } catch (error) {
    next(error);
  }
}
