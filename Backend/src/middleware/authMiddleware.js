// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/users.js';
import Admin from '../models/admin.js';

export const protect = async (req, res, next) => {
  let token;
  let expectedType;

  // Chọn token dựa trên route
  if (req.originalUrl.startsWith('/api/admin')) {
    token = req.cookies.adminToken;
    expectedType = 'admin';
  } else if (req.originalUrl.startsWith('/api')) {
    token = req.cookies.token;
    expectedType = 'user';
  } else {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập!',
    });
  }

  // Kiểm tra token tồn tại
  if (!token) {
    return res.status(401).json({
      success: false,
      message: `Bạn chưa đăng nhập!`,
    });
  }

  try {
    // Xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kiểm tra type của token
    if (decoded.type !== expectedType) {
      return res.status(403).json({
        success: false,
        message: `Token có type ${decoded.type} không hợp lệ cho route này (mong đợi ${expectedType})`,
      });
    }

    // Gán thông tin người dùng
    if (decoded.type === 'user') {
      req.user = await User.findById(decoded.id).select('+password_hash');
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }
      req.userType = 'user';
    } else if (decoded.type === 'admin') {
      req.user = await Admin.findById(decoded.id).select('+password_hash');
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy admin',
        });
      }
      req.userType = 'admin';
    } else {
      return res.status(401).json({
        success: false,
        message: 'Loại người dùng không hợp lệ',
      });
    }

    next();
  } catch (error) {
    console.error('Lỗi middleware xác thực:', error);
    res.status(401).json({
      success: false,
      message: 'Không được phép, token không hợp lệ',
    });
  }
};

export const restrictToAdmin = (req, res, next) => {
  if (req.userType === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập, yêu cầu tài khoản admin',
    });
  }
};

export const restrictToClient = (req, res, next) => {
  if (req.userType === 'user') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập, yêu cầu tài khoản client',
    });
  }
};