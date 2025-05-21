import { insertRatingService, forgotPasswordByEmailService, registerUserService, loginUserService, updateUserService, updateUserPasswordService, getChartService, getUserBookingStats, resetPasswordService } from "../services/userServices.js";
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
  console.time("loginUserController");
  const isProduction = process.env.NODE_ENV === 'production';
  try {
      const { username, password } = req.body;
      if (!username || !password) {
          console.timeEnd("loginUserController");
          return res.status(400).json({ message: "Vui lòng nhập đầy đủ username và password!" });
      }
      console.time("callLoginUserService");
      const { user, token } = await loginUserService(username, password);
      console.timeEnd("callLoginUserService");

      console.time("setCookie");
      res.cookie("token", token, {
          httpOnly: true,
          secure: isProduction, // Chỉ bật secure ở production (HTTPS)
          sameSite: 'strict',  // Ngăn CSRF qua cross-site request
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
      });

      console.timeEnd("setCookie");

      console.time("sendResponse");
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
              // Không cần trả về failed_login_attempts hay lock_until ra frontend
          },
          message: "Đăng nhập thành công!",
      });
      console.timeEnd("sendResponse");
      console.timeEnd("loginUserController");
  } catch (error) {
      console.error("Lỗi server khi đăng nhập:", error);
      // Cập nhật status code dựa trên loại lỗi
      let statusCode = 500;
      if (error.message.includes("User không tồn tại!") || error.message.includes("Sai mật khẩu!")) {
          statusCode = 401; // Unauthorized
      } else if (error.message.includes("Tài khoản của bạn đã bị khóa")) {
          statusCode = 403; // Forbidden
      }
      res.status(statusCode).json({ message: error.message });
      console.timeEnd("loginUserController");
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

    const safeUser = {
      _id: req.user._id,
      avatar_image_path: req.user.avatar_image_path,
      email: req.user.email,
      favouriteCenter: req.user.favouriteCenter,
      level: req.user.level,
      name: req.user.name,
      phone_number: req.user.phone_number,
      points: req.user.points,
      registration_date: req.user.registration_date,
      stats: req.user.stats,
      updatedAt: req.user.updatedAt,
      username: req.user.username,
      __v: req.user.__v,
    };

    res.status(200).json({ success: true, user: safeUser });
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
    const userId = req.user._id; // User ID from auth middleware
    const payload = req.body; // Payload from request (JSON or FormData processed by middleware)

    // Call the updated user service
    const updatedUser = await updateUserService(userId, payload);

    // Return success response
    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin người dùng thành công!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUserController:", error.message);
    // Return error response with consistent format
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi hệ thống khi cập nhật thông tin người dùng!",
    });
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
    // Xóa cookie JWT
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Xóa cookie CSRF
    res.clearCookie("_csrf", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Hủy session (nếu sử dụng express-session)
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi hủy session." });
      }

      // Gửi phản hồi yêu cầu frontend xóa CSRF token
      res.status(200).json({
        success: true,
        message: "Đăng xuất thành công!",
        clearCsrf: true, // Thông báo frontend xóa CSRF token
      });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * Controller lấy dữ liệu biểu đồ
 */
export const getChartController = async (req, res) => {
  const userId = req.user._id;
  try {
    const months = await getChartService(userId);
    return res.json({ success: true, chartData: months });
  } catch (error) {
    console.error("Error in getChartDataController:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Controller lấy thống kê booking chi tiết
 */
export const getDetailedBookingStatsController = async (req, res) => {
  try {
    const period = req.query.period || "month";
    const userId = req.user._id;
    const stats = await getUserBookingStats(userId, period);
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error in getDetailedBookingStatsController:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Controller quên mật khẩu qua email
 */
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

/**
 * Controller đặt lại mật khẩu từ liên kết
 */
export const resetPasswordController = async (req, res) => {
  const { userId, token } = req.params;
  console.log("🚀 ~ resetPasswordController ~ userId:", userId)
  console.log("🚀 ~ resetPasswordController ~ token:", token)
  const { newPassword } = req.body;

  try {
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu mới.",
      });
    }

    const result = await resetPasswordService(userId, token, newPassword);

    if (!result.success) {
      // Nếu token hết hạn hoặc không hợp lệ, trả về mã lỗi phù hợp
      return res.status(400).json({
        success: false,
        message: result.message || "Liên kết không hợp lệ hoặc đã hết hạn.",
      });
    }

    // Thành công
    return res.status(200).json({
      success: true,
      message: result.message || "Đặt lại mật khẩu thành công.",
    });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ khi xử lý yêu cầu.",
    });
  }
};


/**
 * Controller thêm đánh giá
 */
export const insertRating = async (req, res) => {
  try {
    const { centerId, stars, comment } = req.body;
    const userId = req.user._id;

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