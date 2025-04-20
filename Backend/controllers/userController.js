// src/controllers/userController.js
import { insertRatingService, forgotPasswordByEmailService, registerUserService, loginUserService, updateUserService, updateUserPasswordService, getChartService, getUserBookingStats } from "../services/userServices.js";
import jwt from "jsonwebtoken";

// Hàm tạo token (có thể để trong service, nhưng ta đặt ở đây để dễ sử dụng)
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/**
 * Controller đăng ký user
 */
export const registerUserController = async (req, res) => {
  try {
    console.log("📩 Dữ liệu từ frontend:", req.body);
    const user = await registerUserService(req.body);
    const token = generateToken(user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      username: user.username,
      avatar_image_path: user.avatar_image_path,
      registration_date: user.registration_date,
      token,
      message: "Đăng ký thành công!"
    });
  } catch (error) {
    console.error("❌ Lỗi server khi đăng ký:", error);
    if (error.status === 400 && error.errors) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau!" });
    }
  }
};

/**
 * Controller đăng nhập user
 */
export const loginUserController = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ username và password!" });
    }
    const { user, token } = await loginUserService(username, password);
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        address: user.address,
        username: user.username,
        avatar_image_path: user.avatar_image_path,
        registration_date: user.registration_date,
        role: user.role,
      },
      message: "Đăng nhập thành công!"
    });
  } catch (error) {
    console.error("Lỗi server khi đăng nhập:", error);
    // Nếu lỗi là do xác thực, trả về 401, nếu không trả về 500
    const statusCode = (error.message === "Sai username hoặc password!" || error.message === "User không tồn tại!") ? 401 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};


/**
 * Controller lấy thông tin user (dùng trong AuthContext)
 */
export const getUserInfoController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error("Error in getUserInfoController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Controller cập nhật thông tin user
 */
export const updateUserController = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const updatedUser = await updateUserService(userId, req.body);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in updateUserController:", error);
    next(error);
  }
};

/**
 * Controller cập nhật mật khẩu user
 */
export const updateUserPasswordController = async (req, res) => {
  try {
    const user = req.user;
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập đủ thông tin" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }
    await updateUserPasswordService(user, oldPassword, newPassword);
    res.status(200).json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Error in updateUserPasswordController:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Controller đăng xuất
 */
export const logoutController = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.status(200).json({ success: true, message: "Đăng xuất thành công!" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChartController = async (req, res) => {
  // User được gán vào req.user bởi middleware protect
  const userId = req.user._id;
  try {
    const months = await getChartService(userId);
    return res.json({ success: true, chartData: months });
  } catch (error) {
    console.error("Error in getChartDataController:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDetailedBookingStatsController = async (req, res) => {
  try {
    const period = req.query.period || "month"; // week, month, year
    const userId = req.user._id; // Lấy từ middleware protect
    const stats = await getUserBookingStats(userId, period);
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error in getDetailedBookingStatsController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPasswordByEmailController = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await forgotPasswordByEmailService(email);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("Lỗi quên mật khẩu bằng email:", error);
    res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi xử lý yêu cầu." });
  }
};

// Thêm đánh giá từ người dùng
export const insertRating = async (req, res) => {
  try {
    const { centerId, stars, comment } = req.body;
    // Lấy userId từ thông tin user đã được middleware set vào req.user
    const userId = req.user._id;

    // Gọi service để xử lý logic thêm đánh giá
    const newRating = await insertRatingService({ centerId, userId, stars, comment });

    res.status(201).json({ message: "Đánh giá thành công!", rating: newRating });
  } catch (error) {
    console.error("❌ Lỗi khi thêm đánh giá:", error);
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: "Lỗi server!" });
  }
};
