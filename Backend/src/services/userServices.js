// userServices.js
import Rating from "../models/ratings.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users.js";
import mongoose from "mongoose";
import Chart from "../models/charts.js";
import dotenv from "dotenv";
import Center from "../models/centers.js";
import Booking from "../models/bookings.js";
import { checkEmailExistsService, updateAvgRating, sendEmailService, checkEmailUniqueness } from "../middleware/userMiddleware.js";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// Load environment variables from .env file
dotenv.config();

// Constants for level calculation
const levels = ["Sắt", "Đồng", "Bạc", "Vàng", "Bạch kim"];
const pointsPerLevel = 1000;
const isInvalidPasswordComplexity = (password) => {
    return (
      password.length < 8 || // Tối thiểu 8 ký tự
      !/[A-Z]/.test(password) || // Ít nhất một chữ hoa
      !/[a-z]/.test(password) || // Ít nhất một chữ thường
      !/[0-9]/.test(password) || // Ít nhất một số
      !/[!@#$%^&*(),.?":{}|<>]/.test(password) // Ít nhất một ký tự đặc biệt
    );
};
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 10 * 60 * 1000; // 10 phút tính bằng mili giây

const FORBIDDEN_WORDS = [
    "đm", "đmm", "vcl", "vl", "đ*t", "d*t", "địt", "dịt", "l*n", "lon", "lồn", "c*c", "cac", "cặc",
    "ngu", "ngu ngốc", "đần", "khốn nạn", "khốn kiếp", "chó", "con chó", "mẹ mày", "bố mày",
    "thằng ngu", "con điên", "đồ ngu", "đồ điên", "súc vật", "đê tiện", "hèn hạ", "lừa đảo", "đồ đểu", "djt",
    // Thêm các từ khác nếu cần
];

// Hàm kiểm tra từ không cho phép
const containsForbiddenWords = (text) => {
    const lowerText = text.toLowerCase();
    return FORBIDDEN_WORDS.some(word => lowerText.includes(word));
};

/**
 * Đăng ký user mới
 */
export const registerUserService = async (userData) => {
    const { name, email, phone_number, username, password, avatar_image_path } = userData;
    const errors = {};

    // Validate input fields
    if (!name || !name.trim()) errors.name = "Vui lòng nhập Họ và tên";

    if (!email || !email.trim()) {
        errors.email = "Vui lòng nhập Email";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.email = "Email không hợp lệ";
    }

    if (!phone_number || !phone_number.trim()) {
        errors.phone_number = "Vui lòng nhập Số điện thoại";
    } else {
        const validPrefixes = [
            "032", "033", "034", "035", "036", "037", "038", "039",
            "055", "056", "057", "058", "059",
            "070", "076", "077", "078", "079",
            "081", "082", "083", "084", "085", "086", "087", "088", "089",
            "090", "091", "092", "093", "094", "095", "096", "097", "098", "099"
        ];
        let isValidPhone = false;
        let phoneError = "Số điện thoại không hợp lệ!";

        if (phone_number.startsWith("+84")) {
            const phoneWithoutPrefix = phone_number.slice(3);
            if (/^\d{9}$/.test(phoneWithoutPrefix)) {
                const mobilePrefix = phoneWithoutPrefix.slice(0, 3);
                if (validPrefixes.includes("0" + mobilePrefix)) {
                    isValidPhone = true;
                } else {
                    phoneError = "Đầu số không hợp lệ!";
                }
            }
        } else if (phone_number.startsWith("0")) {
            if (/^\d{10}$/.test(phone_number)) {
                const mobilePrefix = phone_number.slice(0, 3);
                if (validPrefixes.includes(mobilePrefix)) {
                    isValidPhone = true;
                } else {
                    phoneError = "Đầu số không hợp lệ!";
                }
            }
        } else {
            phoneError = "Số điện thoại phải bắt đầu bằng 0 hoặc +84!";
        }

        if (!isValidPhone) {
            errors.phone_number = phoneError;
        }
    }

    if (!username || !username.trim()) {
        errors.username = "Vui lòng nhập Tên đăng nhập";
    } else if (/\s/.test(username)) {
        errors.username = "Tên đăng nhập không được chứa khoảng trắng!";
    }

    if (!password) {
        errors.password = "Vui lòng nhập Mật khẩu";
    } else {
        const isInvalidPassword = (
            password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[a-z]/.test(password) ||
            !/[0-9]/.test(password) ||
            !/[!@#$%^&*(),.?":{}|<>]/.test(password)
        );
        if (isInvalidPassword) {
            errors.password = "Mật khẩu cần có độ dài tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";
        }
    }

    // Combine existence checks into a single query for efficiency
    const existingUsers = await User.find({
        $or: [
            { email: email },
            { phone_number: phone_number },
            { username: username }
        ]
    });

    existingUsers.forEach(user => {
        if (user.email === email) errors.email = "Email đã được sử dụng!";
        if (user.phone_number === phone_number) errors.phone_number = "Số điện thoại đã được sử dụng!";
        if (user.username === username) errors.username = "Tên đăng nhập đã được sử dụng!";
    });

    if (Object.keys(errors).length > 0) {
        throw { status: 400, errors };
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        phone_number,
        username,
        password_hash: hashedPassword,
        avatar_image_path: avatar_image_path || ""
    });
    return user;
};

/**
 * Đăng nhập user
 */
export const loginUserService = async (username, password) => {
    const user = await User.findOne({ username }).select("+password_hash +failed_login_attempts +lock_until");
    
    if (!user) {
        throw new Error("User không tồn tại!");
    }

    // 1. Kiểm tra tài khoản có đang bị khóa không
    if (user.lock_until && user.lock_until > new Date()) {
        const remainingLockTimeSeconds = Math.ceil((user.lock_until.getTime() - new Date().getTime()) / 1000);
        const minutes = Math.floor(remainingLockTimeSeconds / 60);
        const seconds = remainingLockTimeSeconds % 60;
        throw new Error(`Tài khoản của bạn đã bị khóa. Vui lòng thử lại sau ${minutes} phút ${seconds} giây.`);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
        // 2. Tăng số lần đăng nhập sai
        user.failed_login_attempts += 1;

        // 3. Kiểm tra nếu số lần sai vượt ngưỡng
        if (user.failed_login_attempts >= MAX_FAILED_ATTEMPTS) {
            user.lock_until = new Date(Date.now() + LOCK_TIME); // Khóa tài khoản
            user.failed_login_attempts = 0; // Reset số lần sai khi đã khóa
            await user.save();
            throw new Error(`Bạn đã nhập sai mật khẩu quá ${MAX_FAILED_ATTEMPTS} lần. Tài khoản của bạn đã bị khóa trong 10 phút.`);
        } else {
            await user.save();
            const remainingAttempts = MAX_FAILED_ATTEMPTS - user.failed_login_attempts;
            throw new Error(`Sai mật khẩu! Bạn còn ${remainingAttempts} lần thử trước khi tài khoản bị khóa.`);
        }
    }

    // 4. Đăng nhập thành công: Reset số lần đăng nhập sai và thời gian khóa
    user.failed_login_attempts = 0;
    user.lock_until = null;
    await user.save();

    const token = jwt.sign(
        { id: user._id, type: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
    
    // Convert Mongoose document to plain object and remove password_hash
    const userObj = user.toObject();
    delete userObj.password_hash; // Xóa trường password_hash khỏi object trả về

    return { token, user: userObj };
};

/**
 * Cập nhật thông tin user
 */
export const updateUserService = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("Không tìm thấy người dùng!");
        }

        // Nếu cập nhật email, thực hiện xác thực
        if (payload.email && payload.email !== user.email) {
            const uniquenessCheck = await checkEmailUniqueness(payload.email, userId);
            if (!uniquenessCheck.success) {
                throw new Error(uniquenessCheck.message);
            }

            const emailCheck = await checkEmailExistsService(payload.email);
            if (!emailCheck.success) {
                throw new Error(emailCheck.message);
            }
        }

        // Xóa ảnh đại diện cũ nếu cập nhật avatar_image_path
        const currentDir = process.cwd();
        if (payload.avatar_image_path && user.avatar_image_path && payload.avatar_image_path !== user.avatar_image_path) {
            const oldPath = path.join(currentDir, user.avatar_image_path);
            try {
                await fs.access(oldPath);
                await fs.unlink(oldPath);
                console.log(`Đã xóa ảnh cũ tại: ${oldPath}`);
            } catch (error) {
                if (error.code !== "ENOENT") {
                    console.error(`Lỗi khi xóa ảnh cũ tại ${oldPath}:`, error);
                    throw new Error("Lỗi hệ thống khi xóa ảnh cũ"); // Ném lỗi để hủy yêu cầu
                }
            }
        }

        // Cập nhật thông tin người dùng
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $set: payload },
            { new: true }
        );

        // Loại bỏ password_hash trước khi trả về
        const userObject = updatedUser.toObject();
        delete userObject.password_hash;

        return userObject;
    } catch (error) {
        throw error;
    }
};

/**
 * Cập nhật mật khẩu user
 */
export const updateUserPasswordService = async (user, oldPassword, newPassword) => {
    // 1. Xác thực đầu vào cơ bản (có thể được xử lý ở controller hoặc service, nhưng service là nơi tốt để xác thực tất cả logic nghiệp vụ)
    if (!oldPassword || !newPassword) {
      throw new Error("Vui lòng nhập đủ thông tin");
    }
  
    // 2. Kiểm tra mật khẩu cũ có đúng không
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      throw new Error("Mật khẩu cũ không chính xác.");
    }
  
    // 3. Kiểm tra mật khẩu mới có trùng với mật khẩu cũ không
    if (oldPassword === newPassword) {
      throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ.");
    }
  
    // 4. Kiểm tra độ phức tạp của mật khẩu mới
    if (isInvalidPasswordComplexity(newPassword)) {
      throw new Error("Mật khẩu mới cần có độ dài tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
    }
  
    // 5. Mã hóa mật khẩu mới và lưu vào DB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password_hash = hashedPassword;
    await user.save(); // Save the updated user document
  
    return user;
};

/**
 * Tính và cập nhật level của user dựa trên points
 */
export const updateUserLevel = async (userId) => {
    try {
        // Find user and update level in a single operation
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User không tồn tại");
        }

        const userPoints = user.points || 0;
        const currentLevelIndex = Math.min(Math.floor(userPoints / pointsPerLevel), levels.length - 1);
        const currentLevelName = levels[currentLevelIndex];

        // Only update if the level has changed
        if (user.level !== currentLevelName) {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: { level: currentLevelName } },
                { new: true, select: 'level' } // Select only the 'level' field to return
            );
            console.log(`Cập nhật level cho user ${userId}: ${updatedUser.level}`);
            return { currentLevelName: updatedUser.level };
        }
        
        console.log(`Level của user ${userId} không thay đổi: ${user.level}`);
        return { currentLevelName: user.level }; // Return current level if no update needed
    } catch (error) {
        console.error("Lỗi khi cập nhật level cho user:", error);
        throw new Error("Có lỗi xảy ra khi cập nhật level user");
    }
};

/**
 * Cập nhật số lượng completed bookings cho user
 */
export const updateCompletedBookingsForUser = async (userId) => {
    try {
        const completedCount = await Booking.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            status: "paid" // Assuming 'status' is the correct field for payment status
        });
        console.log(`Đếm completed bookings cho user ${userId}: ${completedCount}`);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { "stats.completedBookings": completedCount } },
            { new: true, select: 'stats.completedBookings' } // Select only the updated field
        );

        if (updatedUser) {
            console.log(`Cập nhật thành công stats.completedBookings cho user ${userId}: ${updatedUser.stats.completedBookings}`);
        } else {
            console.log(`Không tìm thấy user ${userId} để cập nhật stats.completedBookings.`);
        }
        return completedCount;
    } catch (error) {
        console.error("Error updating completed bookings for user:", error);
        throw error;
    }
};

/**
 * Tăng tổng số bookings của user
 */
export const incrementTotalBookings = async (userId) => {
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { "stats.totalBookings": 1 } },
        { new: true, select: 'stats.totalBookings' } // Select only the updated field
    );
    console.log(`User ${userId} stats.totalBookings được tăng lên thành: ${updatedUser.stats.totalBookings}`);
    return updatedUser.stats.totalBookings;
};

/**
 * Đánh dấu booking bị hủy
 */
export const markBookingAsCancelled = async (userId) => {
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { "stats.cancelledBookings": 1 } },
        { new: true, select: 'stats.cancelledBookings' } // Select only the updated field
    );
    return updatedUser;
};

/**
 * Cập nhật điểm của user dựa trên totalAmount
 */
export const updateUserPoints = async (userId, totalAmount) => {
    let pointsToAdd = 0;
    if (totalAmount > 100000 && totalAmount < 200000) {
        pointsToAdd = 100;
    } else if (totalAmount >= 200000 && totalAmount < 300000) {
        pointsToAdd = 200;
    } else if (totalAmount >= 300000 && totalAmount < 400000) {
        pointsToAdd = 300;
    } else if (totalAmount >= 400000 && totalAmount < 500000) {
        pointsToAdd = 400;
    } else if (totalAmount >= 500000) {
        pointsToAdd = 500;
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { points: pointsToAdd } },
        { new: true }
    );
    console.log(
        `User ${userId} được cộng ${pointsToAdd} điểm, tổng điểm mới: ${updatedUser.points}`
    );

    // Gọi hàm updateUserLevel để cập nhật level sau khi điểm thay đổi
    await updateUserLevel(userId);

    return { totalPoints: updatedUser.points, pointsEarned: pointsToAdd };
};

/**
 * Cập nhật số completed cho tháng tương ứng
 */
export const updateChartForCompleted = async (userId, date = new Date()) => {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    const monthNumber = date.getMonth() + 1;
    const monthKey = "T" + monthNumber;

    // Use findOneAndUpdate with upsert to create if not exists and update atomically
    const chartData = await Chart.findOneAndUpdate(
        { user: userId, "months.month": monthKey },
        { $inc: { "months.$.completed": 1 } }, // Increment 'completed' for the matched month
        { new: true, upsert: true } // Return the updated document, create if not exists
    );

    // If the month did not exist, or if the document was newly created,
    // we might need to initialize other months.
    // This is a common pattern for chart data, but can be done more efficiently
    // if the defaultMonths array is always expected to be full.
    // For simplicity and to avoid complex aggregation for default,
    // we'll fetch and save if the direct update didn't work as expected (e.g., new user).
    if (!chartData || !chartData.months.find(m => m.month === monthKey)) {
        let existingChart = await Chart.findOne({ user: userId });
        if (!existingChart) {
            const defaultMonths = [];
            for (let i = 1; i <= 12; i++) {
                defaultMonths.push({ month: "T" + i, completed: 0, cancelled: 0 });
            }
            existingChart = new Chart({ user: userId, months: defaultMonths });
        }
        const monthObj = existingChart.months.find((m) => m.month === monthKey);
        if (monthObj) {
            monthObj.completed += 1;
        }
        await existingChart.save();
        return existingChart;
    }

    return chartData;
};

/**
 * Cập nhật số cancelled cho tháng tương ứng
 */
export const updateChartForCancelled = async (userId, date = new Date()) => {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    const monthNumber = date.getMonth() + 1;
    const monthKey = "T" + monthNumber;

    // Use findOneAndUpdate with upsert to create if not exists and update atomically
    const chartData = await Chart.findOneAndUpdate(
        { user: userId, "months.month": monthKey },
        { $inc: { "months.$.cancelled": 1 } }, // Increment 'cancelled' for the matched month
        { new: true, upsert: true } // Return the updated document, create if not exists
    );

    // Similar fallback logic as updateChartForCompleted
    if (!chartData || !chartData.months.find(m => m.month === monthKey)) {
        let existingChart = await Chart.findOne({ user: userId });
        if (!existingChart) {
            const defaultMonths = [];
            for (let i = 1; i <= 12; i++) {
                defaultMonths.push({ month: "T" + i, completed: 0, cancelled: 0 });
            }
            existingChart = new Chart({ user: userId, months: defaultMonths });
        }
        const monthObj = existingChart.months.find((m) => m.month === monthKey);
        if (monthObj) {
            monthObj.cancelled += 1;
        }
        await existingChart.save();
        return existingChart;
    }

    return chartData;
};

/**
 * Lấy dữ liệu biểu đồ
 */
export const getChartService = async (userId) => {
    const chartData = await Chart.findOne({ user: userId });
    if (!chartData) {
        const defaultMonths = [];
        for (let i = 1; i <= 12; i++) {
            defaultMonths.push({ month: "T" + i, completed: 0, cancelled: 0 });
        }
        return defaultMonths;
    }
    return chartData.months;
};

/**
 * So sánh thay đổi giữa hai khoảng thời gian
 */
const compareChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat(((current - previous) / previous) * 100).toFixed(2); // Format to 2 decimal places
};

/**
 * Lấy thống kê booking của user
 */
export const getUserBookingStats = async (userId, period = "month") => {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const currentDate = now.getUTCDate();

    let currentStart, previousStart, previousEnd;

    if (period === "week") {
        const dayOfWeek = now.getUTCDay();
        const diffToMonday = (dayOfWeek + 6) % 7;
        currentStart = new Date(Date.UTC(currentYear, currentMonth, currentDate - diffToMonday, 0, 0, 0, 0));
        previousStart = new Date(Date.UTC(currentYear, currentMonth, currentDate - diffToMonday - 7, 0, 0, 0, 0));
        previousEnd = new Date(Date.UTC(currentYear, currentMonth, currentDate - diffToMonday - 1, 23, 59, 59, 999));
    } else if (period === "month") {
        currentStart = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0));
        previousStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1, 0, 0, 0, 0));
        previousEnd = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));
    } else if (period === "year") {
        currentStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
        previousStart = new Date(Date.UTC(currentYear - 1, 0, 1, 0, 0, 0, 0));
        previousEnd = new Date(Date.UTC(currentYear - 1, 11, 31, 23, 59, 59, 999));
    } else {
        throw new Error("Invalid period parameter. Use 'week', 'month' or 'year'.");
    }

    // Combine all aggregation queries into a single pipeline using $facet
    const aggregationResult = await Booking.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                // Match bookings within both current and previous periods
                createdAt: { $gte: previousStart, $lte: now }
            }
        },
        {
            $facet: {
                "currentPeriodStats": [
                    {
                        $match: {
                            createdAt: { $gte: currentStart, $lte: now }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            completedCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
                            cancelledCount: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                            totalPoints: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$pointEarned", 0] } },
                            totalAmount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0] } }
                        }
                    }
                ],
                "previousPeriodStats": [
                    {
                        $match: {
                            createdAt: { $gte: previousStart, $lte: previousEnd }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            completedCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
                            cancelledCount: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                            totalPoints: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$pointEarned", 0] } },
                            totalAmount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$totalAmount", 0] } }
                        }
                    }
                ]
            }
        }
    ]);

    // Extract results
    const currentStats = aggregationResult[0].currentPeriodStats[0] || {};
    const previousStats = aggregationResult[0].previousPeriodStats[0] || {};

    const currentCompleted = currentStats.completedCount || 0;
    const currentCancelled = currentStats.cancelledCount || 0;
    const currentPoints = currentStats.totalPoints || 0;
    const currentAmount = currentStats.totalAmount || 0;
    const currentTotal = currentCompleted + currentCancelled;

    const previousCompleted = previousStats.completedCount || 0;
    const previousCancelled = previousStats.cancelledCount || 0;
    const previousPoints = previousStats.totalPoints || 0;
    const previousAmount = previousStats.totalAmount || 0;
    const previousTotal = previousCompleted + previousCancelled;

    const comparison = {
        completedChange: compareChange(currentCompleted, previousCompleted),
        cancelledChange: compareChange(currentCancelled, previousCancelled),
        totalChange: compareChange(currentTotal, previousTotal),
        pointsChange: compareChange(currentPoints, previousPoints),
        amountChange: compareChange(currentAmount, previousAmount)
    };

    return {
        current: {
            completed: currentCompleted,
            cancelled: currentCancelled,
            total: currentTotal,
            points: currentPoints,
            amount: currentAmount
        },
        previous: {
            completed: previousCompleted,
            cancelled: previousCancelled,
            total: previousTotal,
            points: previousPoints,
            amount: previousAmount
        },
        comparison
    };
};

/**
 * Quên mật khẩu qua email
 */
export const forgotPasswordByEmailService = async (email) => {
    // Xác thực định dạng email
    if (!email || !email.trim()) {
        throw { status: 400, message: "Vui lòng nhập Email" };
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw { status: 400, message: "Email không hợp lệ" };
    }

    const user = await User.findOne({ email });

    if (!user) {
        return { success: false, message: "Không tìm thấy người dùng với email này." };
    }

    // Tạo token đặt lại mật khẩu
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = Date.now() + 3600000; // Hết hạn sau 1 giờ

    // Lưu hash token và thời gian hết hạn
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Tạo URL đặt lại mật khẩu
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}/${user._id}`;
    const subject = "Đặt Lại Mật Khẩu";
    const html = `
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
        <p>Vui lòng nhấp vào liên kết sau để đặt lại mật khẩu:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
    `;

    try {
        await sendEmailService(email, subject, html);
        return { success: true, message: "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn." };
    } catch (error) {
        console.error("Lỗi khi gửi email đặt lại mật khẩu:", error);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return { success: false, message: "Lỗi khi gửi email đặt lại mật khẩu." };
    }
};

/**
 * Đặt lại mật khẩu từ liên kết
 */
export const resetPasswordService = async (userId, token, newPassword) => {
    const user = await User.findById(userId);

    if (!user) {
        return { success: false, message: "Người dùng không tồn tại." };
    }

    // Xác thực token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (
        user.resetPasswordToken !== resetTokenHash ||
        !user.resetPasswordExpires ||
        user.resetPasswordExpires < Date.now()
    ) {
        return { success: false, message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." };
    }

    // Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu và xóa token
    user.password_hash = hashedNewPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { success: true, message: "Mật khẩu đã được đặt lại thành công." };
};

/**
 * Thêm đánh giá
 */
export const insertRatingService = async ({ centerId, userId, stars, comment }) => {
    if (!centerId || !userId || !stars) {
        throw { status: 400, message: "Vui lòng điền đầy đủ thông tin!" };
    }

    if (stars < 1 || stars > 5) {
        throw { status: 400, message: "Số sao phải từ 1 đến 5!" };
    }

    // Kiểm tra nội dung đánh giá có chứa từ không cho phép không
    if (comment && containsForbiddenWords(comment)) {
        // Trừ 500 điểm của người dùng, cho phép điểm âm
        const user = await User.findById(userId);
        if (!user) {
            throw { status: 404, message: "Người dùng không tồn tại!" };
        }

        const newPoints = user.points - 500; // Cho phép điểm âm
        user.points = newPoints;
        await user.save();

        throw { 
            status: 400, 
            message: `Hệ thống phát hiện bạn sử dụng các từ không cho phép, bạn đã bị trừ 500 điểm. Điểm hiện tại: ${newPoints}.`,
            pointsDeducted: 500,
            newPoints: newPoints
        };
    }

    const newRating = new Rating({
        center: centerId,
        user: userId,
        stars,
        comment,
    });

    await newRating.save();
    console.log("✅ Đã thêm rating thành công!");

    await updateAvgRating(centerId);

    return newRating;
};

/**
 * Cập nhật trung tâm yêu thích
 */
export const updateFavouriteCenter = async (userId, centerId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User không tồn tại");
        }

        const center = await Center.findById(centerId);
        if (!center) {
            throw new Error("Trung tâm không tồn tại");
        }

        const centerName = center.name;

        // Try to increment the count for an existing favorite center
        const updateResult = await User.updateOne(
            { _id: userId, "favouriteCenter.centerName": centerName },
            { $inc: { "favouriteCenter.$.bookingCount": 1 } }
        );

        if (updateResult.matchedCount === 0) {
            // If no existing favorite center was found, add a new one
            await User.updateOne(
                { _id: userId },
                { $push: { favouriteCenter: { centerName: centerName, bookingCount: 1 } } }
            );
        }

        const updatedUser = await User.findById(userId).select('favouriteCenter');
        console.log(`Đã cập nhật danh sách yêu thích của user ${userId}`);
        return updatedUser.favouriteCenter;
    } catch (error) {
        console.error("Error updating favourite center:", error);
        throw new Error("Có lỗi xảy ra khi cập nhật danh sách yêu thích");
    } 
};

/**
 * Lấy thống kê booking của user
 */
export const getPopularTimeSlot = async (userId) => {
    const bookings = await Booking.find({ status: "paid", userId });
    console.log(`Found ${bookings.length} booked bookings for user ${userId}`);

    const timeslotCounts = {};
    const categoryCounts = {
        "Sáng": 0,
        "Trưa": 0,
        "Chiều": 0,
        "Tối": 0,
    };
    let totalSlots = 0;

    const getTimeCategory = (slot) => {
        const hour = parseInt(slot);
        if (hour >= 5 && hour < 12) return "Sáng";
        if (hour >= 12 && hour < 14) return "Trưa";
        if (hour >= 14 && hour < 18) return "Chiều";
        if (hour >= 18 && hour <= 24) return "Tối";
        return "Khác";
    };

    bookings.forEach((booking) => {
        if (booking.courts && Array.isArray(booking.courts)) {
            booking.courts.forEach((court) => {
                if (Array.isArray(court.timeslots)) {
                    court.timeslots.forEach((slot) => {
                        totalSlots++;
                        timeslotCounts[slot] = (timeslotCounts[slot] || 0) + 1;
                        const category = getTimeCategory(slot);
                        if (category in categoryCounts) {
                            categoryCounts[category] += 1;
                        }
                    });
                }
            });
        }
    });

    let popularSlot = null;
    let maxCount = 0;
    for (const slot in timeslotCounts) {
        if (timeslotCounts[slot] > maxCount) {
            maxCount = timeslotCounts[slot];
            popularSlot = slot;
        }
    }

    let popularTimeRange = null;
    if (popularSlot !== null) {
        const startHour = parseInt(popularSlot);
        const startTime = startHour.toString().padStart(2, "0") + ":00";
        const totalTime = startHour + 1;
        const endHour = Math.floor(totalTime);
        const endMinutes = (totalTime - endHour) * 60;
        const endTime = endHour.toString().padStart(2, "0") + ":" + (endMinutes === 30 ? "30" : "00");
        popularTimeRange = `${startTime} - ${endTime}`;
    }

    const categoryPercentages = {};
    Object.keys(categoryCounts).forEach((cat) => {
        categoryPercentages[cat] = totalSlots > 0 ? parseFloat(((categoryCounts[cat] / totalSlots) * 100)).toFixed(2) : "0.00";
    });

    return {
        popularSlot,
        popularTimeRange,
        popularCount: maxCount,
        categoryDistribution: {
            counts: categoryCounts,
            percentages: categoryPercentages,
            total: totalSlots,
        },
        timeslotCounts,
    };
};

export const getBookingHistory = async (userId, page = 1, limit = 10) => {
    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalBookings = await Booking.countDocuments({ userId, deleted: { $ne: true } });

        const bookings = await Booking.find({ userId, deleted: { $ne: true } })
            .skip(skip)
            .limit(limitNum)
            .sort({ date: -1 })
            .lean(); // Use .lean() for faster query results when not modifying documents

        const dailyBookings = bookings.filter((booking) => booking.type === "daily");
        const fixedBookings = bookings.filter((booking) => booking.type === "fixed");

        let history = [];

        // Process daily bookings
        for (const booking of dailyBookings) {
            const center = await Center.findById(booking.centerId).select("name").lean();

            const courtTimeArray = await Promise.all(
                booking.courts.map(async (court) => {
                    const courtDoc = await Court.findById(court.courtId).select("name").lean();
                    return `${courtDoc ? courtDoc.name : court.courtId} - ${court.timeslots.join(", ")}`;
                })
            );
            const courtTime = courtTimeArray.join("; ");

            history.push({
                bookingId: booking._id,
                orderId: booking.status === "pending" ? booking._id : booking.bookingCode,
                status: booking.status,
                orderType: booking.type,
                center: center ? center.name : "Không xác định",
                court_time: courtTime,
                date: booking.date,
                price: booking.totalAmount,
                paymentMethod: booking.status === "paid" ? booking.paymentMethod : "",
            });
        }

        // Group fixed bookings
        const fixedGroups = {};

        for (const booking of fixedBookings) {
            const courtsKey = JSON.stringify(
                booking.courts.map((court) => ({
                    courtId: court.courtId.toString(),
                    timeslots: court.timeslots.sort(),
                }))
            );
            const groupKey = `${booking.centerId}-${courtsKey}`;

            if (!fixedGroups[groupKey]) {
                fixedGroups[groupKey] = {
                    bookingIds: [],
                    dates: [],
                    centerId: booking.centerId,
                    courts: booking.courts,
                    status: booking.status,
                    totalAmount: 0,
                    paymentMethod: booking.paymentMethod,
                    bookingCode: booking.bookingCode.split("-").slice(0, 2).join("-"),
                };
            }

            fixedGroups[groupKey].bookingIds.push(booking._id);
            fixedGroups[groupKey].dates.push(new Date(booking.date));
            fixedGroups[groupKey].totalAmount += booking.totalAmount || 0;
        }

        for (const groupKey in fixedGroups) {
            const group = fixedGroups[groupKey];
            const center = await Center.findById(group.centerId).select("name").lean();

            const courtTimeArray = await Promise.all(
                group.courts.map(async (court) => {
                    const courtDoc = await Court.findById(court.courtId).select("name").lean();
                    return `${courtDoc ? courtDoc.name : court.courtId} - ${court.timeslots.join(", ")}`;
                })
            );
            const courtTime = courtTimeArray.join("; ");

            const dates = group.dates.sort((a, b) => a - b);
            const startDate = dates[0];
            const endDate = dates[dates.length - 1];

            history.push({
                bookingId: group.bookingIds,
                orderId: group.status === "pending" ? group.bookingIds[0] : group.bookingCode,
                status: group.status,
                orderType: "fixed",
                center: center ? center.name : "Không xác định",
                court_time: courtTime,
                date: startDate,
                startDate: startDate,
                endDate: endDate,
                price: group.totalAmount,
                paymentMethod: group.status === "paid" ? group.paymentMethod : "",
            });
        }

        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        return {
            history,
            total: totalBookings,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalBookings / limitNum),
        };
    } catch (error) {
        console.error("Lỗi khi lấy booking history:", error);
        throw new Error("Không thể lấy lịch sử đặt sân");
    }
};
