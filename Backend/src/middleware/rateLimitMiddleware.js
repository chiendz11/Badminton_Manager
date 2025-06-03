import rateLimit from 'express-rate-limit';

// Rate limiter cho đăng nhập
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 yêu cầu mỗi IP
  message: "Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút.",
});

// Rate limiter chung (có thể dùng cho các route khác)
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Tối đa 100 yêu cầu mỗi IP
  message: "Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút.",
});