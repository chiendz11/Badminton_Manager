// src/services/userService.js
import Rating from "../models/ratings.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users.js";
import mongoose from "mongoose";
// services/chartDataService.js
import Chart from "../models/charts.js";
import dotenv from "dotenv";
import Center from "../models/centers.js";
import Booking from "../models/bookings.js";
import { checkEmailExistsService, updateAvgRating, sendEmailService, generateRandomPassword } from "../middleware/userMiddleware.js";

dotenv.config();


/**
 * Đăng ký user mới
 */
export const registerUserService = async (userData) => {
    const { name, email, phone_number, address, username, password, avatar_image_path } = userData;
    const errors = {};

    if (!name || !name.trim()) errors.name = "Vui lòng nhập Họ và tên";
    if (!email || !email.trim()) {
        errors.email = "Vui lòng nhập Email";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.email = "Email không hợp lệ";
    }
    if (!phone_number || !phone_number.trim()) errors.phone_number = "Vui lòng nhập Số điện thoại";
    if (!address || !address.trim()) errors.address = "Vui lòng nhập Địa chỉ";
    if (!username || !username.trim()) errors.username = "Vui lòng nhập Tên đăng nhập";
    if (!password) errors.password = "Vui lòng nhập Mật khẩu";
    if (password && password.length < 6) errors.password = "Mật khẩu phải có ít nhất 6 ký tự!";

    // Kiểm tra email với Hunter.io (có thể bỏ qua nếu muốn giảm thời gian)
    const emailCheckResult = await checkEmailExistsService(email);
    if (!emailCheckResult.success) errors.email = emailCheckResult.message;

    // Kiểm tra sự tồn tại của email, số điện thoại và username
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

    // Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        phone_number,
        address,
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
    // Debug log (chỉ dùng khi phát triển)
    console.log("Password nhập:", password);
    console.log("Hash DB:", user.password_hash);
  
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error("Sai username hoặc password!");
    }
  
    const token = jwt.sign(
      { id: user._id, type: "user" }, // Thêm type: "user"
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    return { user, token };
  };

/**
 * Cập nhật thông tin user
 */
export const updateUserService = async (userId, payload) => {
    const updatedUser = await User.findOneAndUpdate(
        { _id: userId },
        { $set: payload },
        { new: true }
    );
    return updatedUser;
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

export const updateCompletedBookingsForUser = async (userId) => {
    try {
        // Đếm số bill có paymentStatus "paid" cho user
        const completedCount = await Booking.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            paymentStatus: "paid"
        });
        console.log(`Đếm completed bookings cho user ${userId}: ${completedCount}`);

        // Cập nhật stats.completedBookings trong document của user
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

export const incrementTotalBookings = async (userId) => {
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { "stats.totalBookings": 1 } },
        { new: true }
    );
    console.log(`User ${userId} stats.totalBookings được tăng lên thành: ${updatedUser.stats.totalBookings}`);
    return updatedUser.stats.totalBookings;
};

export const markBookingAsCancelled = async (userId) => {
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { "stats.cancelledBookings": 1 } },
        { new: true }
    );
    return updatedUser;
};

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
    return { totalPoints: updatedUser.points, pointsEarned: pointsToAdd };
};



// Hàm cập nhật số completed cho tháng tương ứng với ngày truyền vào (bill.date)
export const updateChartForCompleted = async (userId, date = new Date()) => {

    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    const monthNumber = date.getMonth() + 1; // 1 đến 12
    const monthKey = "T" + monthNumber;

    let chartData = await Chart.findOne({ user: userId });
    if (!chartData) {
        // Nếu chưa có, tạo mới với mảng mặc định 12 tháng
        const defaultMonths = [];
        for (let i = 1; i <= 12; i++) {
            defaultMonths.push({ month: "T" + i, completed: 0, cancelled: 0 });
        }
        chartData = new Chart({ user: userId, months: defaultMonths });
    }
    // Tăng số completed cho tháng tương ứng
    const monthObj = chartData.months.find((m) => m.month === monthKey);
    if (monthObj) {
        monthObj.completed += 1;
    }
    await chartData.save();
    return chartData;
};

// Hàm cập nhật số cancelled cho tháng tương ứng với ngày truyền vào (thường dùng new Date())
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

const compareChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

export const getUserBookingStats = async (userId, period = "month") => {
    let currentStart, previousStart, previousEnd;
    // Sử dụng múi giờ Việt Nam cho thời gian hiện tại
    const now = new Date();

    if (period === "week") {
        // Giả sử tuần bắt đầu từ thứ Hai.
        const dayOfWeek = now.getDay(); // 0 (Chủ nhật) - 6
        // Tính khoảng cách tới thứ Hai: nếu ngày hiện tại là Chủ nhật (0) thì diff = 6, nếu không thì diff = dayOfWeek - 1
        const diffToMonday = (dayOfWeek + 6) % 7;
        currentStart = new Date(now);
        currentStart.setDate(now.getDate() - diffToMonday);
        // Đặt giờ cho currentStart là 0:00:00
        currentStart.setHours(0, 0, 0, 0);

        // Previous week: bắt đầu từ thứ Hai của tuần trước và kết thúc vào Chủ nhật của tuần trước.
        previousStart = new Date(currentStart);
        previousStart.setDate(currentStart.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousEnd.setDate(currentStart.getDate() - 1);
    } else if (period === "month") {
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === "year") {
        currentStart = new Date(now.getFullYear(), 0, 1);
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
    } else {
        throw new Error("Invalid period parameter. Use 'week', 'month' or 'year'.");
    }

    console.log("Current period start:", currentStart);
    console.log("Now:", now);
    console.log("Previous period start:", previousStart);
    console.log("Previous period end:", previousEnd);

    // Sử dụng createdAt để lọc, ép kiểu bằng $toDate nếu cần
    const currentPaidBookingAgg = await Booking.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                paymentStatus: "paid",
                $expr: {
                    $and: [
                        { $gte: [{ $toDate: "$createdAt" }, currentStart] },
                        { $lte: [{ $toDate: "$createdAt" }, now] }
                    ]
                }
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
                paymentStatus: "cancelled",
                $expr: {
                    $and: [
                        { $gte: [{ $toDate: "$createdAt" }, currentStart] },
                        { $lte: [{ $toDate: "$createdAt" }, now] }
                    ]
                }
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
                paymentStatus: "paid",
                $expr: {
                    $and: [
                        { $gte: [{ $toDate: "$createdAt" }, previousStart] },
                        { $lte: [{ $toDate: "$createdAt" }, previousEnd] }
                    ]
                }
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
                paymentStatus: "cancelled",
                $expr: {
                    $and: [
                        { $gte: [{ $toDate: "$createdAt" }, previousStart] },
                        { $lte: [{ $toDate: "$createdAt" }, previousEnd] }
                    ]
                }
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

export const forgotPasswordByEmailService = async (email) => {
    const user = await User.findOne({ email });

    if (!user) {
        return { success: false, message: "Không tìm thấy người dùng với email này." };
    }

    // 1. Tạo mật khẩu ngẫu nhiên mới
    const newPassword = generateRandomPassword(12); // Tạo mật khẩu 12 ký tự (ví dụ)

    // 2. Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 3. Cập nhật mật khẩu trong database
    user.password_hash = hashedNewPassword;
    await user.save();

    // 4. Gửi mật khẩu mới đến email của người dùng
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

export const insertRatingService = async ({ centerId, userId, stars, comment }) => {
    // Kiểm tra dữ liệu đầu vào
    if (!centerId || !userId || !stars) {
        throw { status: 400, message: "Vui lòng điền đầy đủ thông tin!" };
    }

    if (stars < 1 || stars > 5) {
        throw { status: 400, message: "Số sao phải từ 1 đến 5!" };
    }


    // Tạo đánh giá mới
    const newRating = new Rating({
        center: centerId,
        user: userId,
        stars,
        comment,
    });

    // Lưu đánh giá vào database
    await newRating.save();
    console.log("✅ Đã thêm rating thành công!");

    // Cập nhật điểm trung bình của center
    await updateAvgRating(centerId);

    return newRating;
};

export const updateFavouriteCenter = async (userId, centerId) => {
    try {
        // Kiểm tra xem user có tồn tại hay không
        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User không tồn tại");
        }

        // Tìm trung tâm theo centerId để lấy centerName
        const center = await Center.findById(centerId);
        if (!center) {
            throw new Error("Trung tâm không tồn tại");
        }

        const centerName = center.name; // Lấy centerName từ trung tâm

        // Kiểm tra nếu trung tâm đã có trong danh sách yêu thích của user
        const existingFavourite = user.favouriteCenter.find(
            (item) => item.centerName === centerName
        );

        if (existingFavourite) {
            // Nếu trung tâm đã có, chỉ cập nhật thông tin bookingCount
            existingFavourite.bookingCount += 1;
        } else {
            // Nếu trung tâm chưa có, thêm mới vào danh sách favouriteCenter
            user.favouriteCenter.push({
                centerName: centerName,  // Lưu lại centerName
                bookingCount: 1,
            });
        }

        // Cập nhật lại danh sách favouriteCenter của user
        await user.save();

        console.log(`Đã cập nhật danh sách yêu thích của user ${userId}`);
        return user.favouriteCenter; // Trả về danh sách favouriteCenter mới của user
    } catch (error) {
        console.error("Error updating favourite center:", error);
        throw new Error("Có lỗi xảy ra khi cập nhật danh sách yêu thích");
    }
};
