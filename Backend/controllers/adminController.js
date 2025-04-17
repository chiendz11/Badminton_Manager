// controllers/adminController.js
import { authenticateAdmin } from '../services/adminServices.js'; // Cập nhật đường dẫn đúng

/**
 * Controller xử lý đăng nhập admin.
 * Nhận username và password từ req.body.
 * Nếu hợp lệ, lưu token vào cookie và trả về thông tin admin.
 */
export async function loginAdmin(req, res, next) {
  try {
    const { username, password } = req.body;

    // Kiểm tra đầu vào
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username và password là bắt buộc',
      });
    }

    // Gọi service để xác thực
    const { admin, token } = await authenticateAdmin(username, password);

    // Lưu token vào cookie
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
    });

    // Trả về thông tin admin
    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        username: admin.username,
        avatar: admin.avatar,
        centers: admin.centers,
        type: 'admin',
      },
    });
  } catch (error) {
    console.error('Lỗi trong loginAdmin controller:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Lỗi khi đăng nhập admin',
    });
  }
}