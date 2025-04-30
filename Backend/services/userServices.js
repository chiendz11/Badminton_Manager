import Rating from "../models/ratings.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users.js";
import mongoose from "mongoose";
import Chart from "../models/charts.js";
import dotenv from "dotenv";
import Center from "../models/centers.js";
import Booking from "../models/bookings.js";
import { checkEmailExistsService, updateAvgRating, sendEmailService, generateRandomPassword } from "../middleware/userMiddleware.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = path.resolve("services/userServices.js");
const __dirname = path.dirname(__filename);
// Constants for level calculation
const levels = ["Sắt", "Đồng", "Bạc", "Vàng", "Bạch kim"];
const pointsPerLevel = 1000;

/**
 * Đăng ký user mới
 */
export const registerUserService = async (userData) => {
    const { name, email, phone_number, username, password, avatar_image_path } = userData;
    const errors = {};

    // Kiểm tra Họ và tên
    if (!name || !name.trim()) errors.name = "Vui lòng nhập Họ và tên";

    // Kiểm tra Email
    if (!email || !email.trim()) {
        errors.email = "Vui lòng nhập Email";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.email = "Email không hợp lệ";
    }

    // Kiểm tra Số điện thoại
    if (!phone_number || !phone_number.trim()) {
        errors.phone_number = "Vui lòng nhập Số điện thoại";
    } else {
        // Danh sách các đầu số di động hợp lệ của Việt Nam
        const validPrefixes = [
            "032", "033", "034", "035", "036", "037", "038", "039", // Đầu số 03x
            "055", "056", "057", "058", "059", // Đầu số 05x
            "070", "076", "077", "078", "079", // Đầu số 07x
            "081", "082", "083", "084", "085", "086", "087", "088", "089", // Đầu số 08x
            "090", "091", "092", "093", "094", "095", "096", "097", "098", "099" // Đầu số 09x
        ];

        // Kiểm tra định dạng số điện thoại
        let isValidPhone = false;
        let phoneError = "Số điện thoại không hợp lệ!";

        // Trường hợp bắt đầu bằng +84
        if (phone_number.startsWith("+84")) {
            const phoneWithoutPrefix = phone_number.slice(3); // Bỏ "+84"
            if (/^\d{9}$/.test(phoneWithoutPrefix)) { // Phải có đúng 9 chữ số
                const mobilePrefix = phoneWithoutPrefix.slice(0, 3); // Lấy 3 chữ số đầu
                if (validPrefixes.includes("0" + mobilePrefix)) {
                    isValidPhone = true;
                } else {
                    phoneError = "Đầu số không hợp lệ!";
                }
            }
        }
        // Trường hợp bắt đầu bằng 0
        else if (phone_number.startsWith("0")) {
            if (/^\d{10}$/.test(phone_number)) { // Phải có đúng 10 chữ số
                const mobilePrefix = phone_number.slice(0, 3); // Lấy 3 chữ số đầu
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

    // Kiểm tra Tên đăng nhập
    if (!username || !username.trim()) {
        errors.username = "Vui lòng nhập Tên đăng nhập";
    } else if (/\s/.test(username)) {
        errors.username = "Tên đăng nhập không được chứa khoảng trắng!";
    }

    // Kiểm tra Mật khẩu
    if (!password) errors.password = "Vui lòng nhập Mật khẩu";
    if (password && password.length < 6) errors.password = "Mật khẩu phải có ít nhất 6 ký tự!";

    // Kiểm tra sự tồn tại của email, phone_number, username
    const emailCheckResult = await checkEmailExistsService(email);
    if (!emailCheckResult.success) errors.email = emailCheckResult.message;

    const [emailExists, phoneExists, usernameExists] = await Promise.all([
        User.findOne({ email }),
        User.findOne({ phone_number }),
        User.findOne({ username })
    ]);

    if (emailExists) errors.email = "Email đã được sử dụng!";
    if (phoneExists) errors.phone_number = "Số điện thoại đã được sử dụng!";
    if (usernameExists) errors.username = "Tên đăng nhập đã được sử dụng!";

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
    const user = await User.findOne({ username }).select("+password_hash");
    if (!user) {
      throw new Error("User không tồn tại!");
    }
    console.log("Password nhập:", password);
    console.log("Hash DB:", user.password_hash);

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error("Sai username hoặc password!");
    }

    const token = jwt.sign(
      { id: user._id, type: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    return { user, token };
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

        // Xóa ảnh cũ nếu cập nhật avatar_image_path
        if (payload.avatar_image_path && user.avatar_image_path) {
            const oldPath = path.join(__dirname, "../", user.avatar_image_path);
            try {
                await fs.access(oldPath); // Kiểm tra xem file có tồn tại không
                await fs.unlink(oldPath); // Xóa file bất đồng bộ
                console.log(`Đã xóa ảnh cũ tại: ${oldPath}`);
            } catch (error) {
                if (error.code !== "ENOENT") {
                    // Chỉ ghi log lỗi nếu không phải lỗi "file không tồn tại"
                    console.error(`Lỗi khi xóa ảnh cũ tại ${oldPath}:`, error);
                }
            }
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $set: payload },
            { new: true }
        );
        return updatedUser;
    } catch (error) {
        throw error;
    }
};

/**
 * Cập nhật mật khẩu user
 */
export const updateUserPasswordService = async (user, oldPassword, newPassword) => {
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) throw new Error("Mật khẩu cũ không chính xác");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedPassword;
    await user.save();
    return user;
};

/**
 * Tính và cập nhật level của user dựa trên points
 */
export const updateUserLevel = async (userId) => {
    try {
        // Tìm user theo userId
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User không tồn tại");
        }

        // Tính level dựa trên points
        const userPoints = user.points || 0;
        const currentLevelIndex = Math.min(Math.floor(userPoints / pointsPerLevel), levels.length - 1);
        const currentLevelName = levels[currentLevelIndex];

        // Cập nhật currentLevelName vào user document
        user.level = currentLevelName;
        await user.save();

        console.log(`Cập nhật level cho user ${userId}: ${currentLevelName}`);
        return { currentLevelName };
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
            paymentStatus: "paid"
        });
        console.log(`Đếm completed bookings cho user ${userId}: ${completedCount}`);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { "stats.completedBookings": completedCount } },
            { new: true }
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
        { new: true }
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
        { new: true }
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

    let chartData = await Chart.findOne({ user: userId });
    if (!chartData) {
        const defaultMonths = [];
        for (let i = 1; i <= 12; i++) {
            defaultMonths.push({ month: "T" + i, completed: 0, cancelled: 0 });
        }
        chartData = new Chart({ user: userId, months: defaultMonths });
    }
    const monthObj = chartData.months.find((m) => m.month === monthKey);
    if (monthObj) {
        monthObj.completed += 1;
    }
    await chartData.save();
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

    let chartData = await Chart.findOne({ user: userId });
    if (!chartData) {
        const defaultMonths = [];
        for (let i = 1; i <= 12; i++) {
            defaultMonths.push({ month: "T" + i, completed: 0, cancelled: 0 });
        }
        chartData = new Chart({ user: userId, months: defaultMonths });
    }
    const monthObj = chartData.months.find((m) => m.month === monthKey);
    if (monthObj) {
        monthObj.cancelled += 1;
    }
    await chartData.save();
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
    return ((current - previous) / previous) * 100;
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

    console.log("Current period start:", currentStart);
    console.log("Now:", now);
    console.log("Previous period start:", previousStart);
    console.log("Previous period end:", previousEnd);

    const currentPaidBookingAgg = await Booking.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                status: "paid",
                createdAt: { $gte: currentStart, $lte: now }
            }
        },
        {
            $group: {
                _id: null,
                completedCount: { $sum: 1 },
                totalPoints: { $sum: "$pointEarned" },
                totalAmount: { $sum: "$totalAmount" }
            }
        }
    ]);
    console.log("Current Bill Aggregation:", currentPaidBookingAgg);

    const currentCompleted = currentPaidBookingAgg.length ? currentPaidBookingAgg[0].completedCount : 0;
    const currentPoints = currentPaidBookingAgg.length ? currentPaidBookingAgg[0].totalPoints : 0;
    const currentAmount = currentPaidBookingAgg.length ? currentPaidBookingAgg[0].totalAmount : 0;

    const currentCancelledBookingAgg = await Booking.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                status: "cancelled",
                createdAt: { $gte: currentStart, $lte: now }
            }
        },
        {
            $group: {
                _id: null,
                cancelledCount: { $sum: 1 }
            }
        }
    ]);
    console.log("Current Bill Cancelled Aggregation:", currentCancelledBookingAgg);

    const currentCancelled = currentCancelledBookingAgg.length ? currentCancelledBookingAgg[0].cancelledCount : 0;
    const currentTotal = currentCompleted + currentCancelled;

    const previousPaidBookingAgg = await Booking.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                status: "paid",
                createdAt: { $gte: previousStart, $lte: previousEnd }
            }
        },
        {
            $group: {
                _id: null,
                completedCount: { $sum: 1 },
                totalPoints: { $sum: "$pointEarned" },
                totalAmount: { $sum: "$totalAmount" }
            }
        }
    ]);
    console.log("Previous Bill Aggregation:", previousPaidBookingAgg);

    const previousCompleted = previousPaidBookingAgg.length ? previousPaidBookingAgg[0].completedCount : 0;
    const previousPoints = previousPaidBookingAgg.length ? previousPaidBookingAgg[0].totalPoints : 0;
    const previousAmount = previousPaidBookingAgg.length ? previousPaidBookingAgg[0].totalAmount : 0;

    const previousCancelledBookingAgg = await Booking.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                status: "cancelled",
                createdAt: { $gte: previousStart, $lte: previousEnd }
            }
        },
        {
            $group: {
                _id: null,
                cancelledCount: { $sum: 1 }
            }
        }
    ]);
    console.log("Previous Cancelled Bill Aggregation:", previousCancelledBookingAgg);

    const previousCancelled = previousCancelledBookingAgg.length ? previousCancelledBookingAgg[0].cancelledCount : 0;
    const previousTotal = previousCompleted + previousCancelled;

    const comparison = {
        completedChange: compareChange(currentCompleted, previousCompleted),
        cancelledChange: compareChange(currentCancelled, previousCancelled),
        totalChange: compareChange(currentTotal, previousTotal),
        pointsChange: compareChange(currentPoints, previousPoints),
        amountChange: compareChange(currentAmount, previousAmount)
    };

    console.log("Current Stats:", { currentCompleted, currentCancelled, currentTotal, currentPoints, currentAmount });
    console.log("Previous Stats:", { previousCompleted, previousCancelled, previousTotal, previousPoints, previousAmount });
    console.log("Comparison:", comparison);

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
    const user = await User.findOne({ email });

    if (!user) {
        return { success: false, message: "Không tìm thấy người dùng với email này." };
    }

    const newPassword = generateRandomPassword(12);
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password_hash = hashedNewPassword;
    await user.save();

    const subject = "Mật khẩu Mới Của Bạn";
    const html = `<p>Chúng tôi đã đặt lại mật khẩu cho tài khoản của bạn.</p>
                  <p>Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
                  <p>Vui lòng đăng nhập bằng mật khẩu này và đổi lại mật khẩu khác sau khi đăng nhập.</p>`;

    try {
        await sendEmailService(email, subject, html);
        return { success: true, message: "Mật khẩu mới đã được gửi đến địa chỉ email của bạn. Vui lòng kiểm tra hộp thư." };
    } catch (error) {
        console.error("Lỗi khi gửi email mật khẩu mới:", error);
        return { success: false, message: "Lỗi khi gửi email mật khẩu mới." };
    }
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

        const existingFavourite = user.favouriteCenter.find(
            (item) => item.centerName === centerName
        );

        if (existingFavourite) {
            existingFavourite.bookingCount += 1;
        } else {
            user.favouriteCenter.push({
                centerName: centerName,
                bookingCount: 1,
            });
        }

        await user.save();

        console.log(`Đã cập nhật danh sách yêu thích của user ${userId}`);
        return user.favouriteCenter;
    } catch (error) {
        console.error("Error updating favourite center:", error);
        throw new Error("Có lỗi xảy ra khi cập nhật danh sách yêu thích");
    }
};