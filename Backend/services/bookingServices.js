// src/services/bookingPendingService.js

import inMemoryCache from "../config/inMemoryCache.js";
import Booking from "../models/bookings.js";
import mongoose from "mongoose";
import Center from "../models/centers.js";
import Court from "../models/courts.js";
import { updateFavouriteCenter, updateCompletedBookingsForUser, markBookingAsCancelled, incrementTotalBookings, updateUserPoints, updateChartForCancelled, updateChartForCompleted } from "./userServices.js";
// ============== CÁC CONSTANT VÀ HÀM PHỤ TRỢ ==============
const TIMES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

export const getPendingKey = (centerId, date, userId) => {
  return `pending:${centerId}:${date}:${userId}`;
};

// ============== HÀM CHUYỂN ĐỔI TIMESLOT TRONG CACHE ==============
export const togglePendingTimeslotMemory = async (userId, centerId, date, courtId, timeslot, ttl = 60) => {
  const key = getPendingKey(centerId, date, userId);
  let booking = inMemoryCache.get(key) || {
    userId,
    centerId,
    date,
    status: "pending",
    courts: []
  };

  const courtIndex = booking.courts.findIndex(c => c.courtId === courtId);
  if (courtIndex > -1) {
    const tsIndex = booking.courts[courtIndex].timeslots.indexOf(timeslot);
    if (tsIndex > -1) {
      booking.courts[courtIndex].timeslots.splice(tsIndex, 1);
      console.log(`Removed timeslot ${timeslot} for court ${courtId} (Cache).`);
      if (booking.courts[courtIndex].timeslots.length === 0) {
        booking.courts.splice(courtIndex, 1);
      }
    } else {
      booking.courts[courtIndex].timeslots.push(timeslot);
      console.log(`Added timeslot ${timeslot} for court ${courtId} (Cache).`);
    }
  } else {
    booking.courts.push({ courtId, timeslots: [timeslot] });
    console.log(`Created new court entry for court ${courtId} with timeslot ${timeslot} (Cache).`);
  }

  if (booking.courts.length === 0) {
    inMemoryCache.del(key);
    console.log(`Pending booking ${key} deleted as no timeslot remains.`);
    return null;
  } else {
    inMemoryCache.set(key, booking, ttl);
    console.log(`Updated pending booking in cache for key ${key}:`, booking);
    return booking;
  }
};

// ============== HÀM LƯU BOOKING PENDING VÀO DB ==============
export const pendingBookingToDB = async (userId, centerId, date, totalAmount) => {
  // Kiểm tra xem đã có booking pending nào chưa (không phân theo ngày)
  const exists = await Booking.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    centerId: new mongoose.Types.ObjectId(centerId),
    status: "pending"
  });
  if (exists) {
    throw new Error("Bạn đã có booking pending trên trung tâm này. Vui lòng chờ hết 5 phút trước khi đặt thêm.");
  }

  const key = getPendingKey(centerId, date, userId);
  const cachedBooking = inMemoryCache.get(key);
  if (!cachedBooking) {
    throw new Error("Không tìm thấy booking pending trong cache");
  }

  const dbBooking = new Booking({
    userId: cachedBooking.userId,
    centerId: cachedBooking.centerId,
    date: cachedBooking.date,
    status: "pending",
    totalAmount: totalAmount,
    courts: cachedBooking.courts,
  });
  await dbBooking.save();
  inMemoryCache.del(key);
  console.log(`Booking pending lưu vào DB cho ngày ${date} (TTL 5 phút), _id=${dbBooking._id}`);
  const updatedTotal = await incrementTotalBookings(userId);
  console.log(`Updated totalBookings for user ${userId}: ${updatedTotal}`);

  return dbBooking;
};

export const bookedBookingInDB = async ({
  userId,
  centerId,
  date,
  totalAmount,
  paymentImage,
  note = ""
}) => {
  try {
    // Tìm booking đang ở trạng thái "pending"
    const query = {
      userId: new mongoose.Types.ObjectId(userId),
      centerId: new mongoose.Types.ObjectId(centerId),
      date: date,
      status: "pending"
    };
    let booking = await Booking.findOne(query);
    if (!booking) {
      // Nếu booking không ở trạng thái pending, kiểm tra xem nó đã được thanh toán chưa
      booking = await Booking.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        centerId: new mongoose.Types.ObjectId(centerId),
        date: date,
        status: "paid"
      });
      if (booking) {
        console.log("Booking đã được thanh toán trước đó.");
        return booking;
      }
      throw new Error("Không tìm thấy booking pending trong DB");
    }

    // Xử lý paymentImage (nếu có)
    let imageBuffer = null;
    let imageType = "image/jpeg";
    if (paymentImage) {
      const matches = paymentImage.match(/^data:(.*);base64,(.*)$/);
      if (matches && matches.length === 3) {
        imageType = matches[1];
        imageBuffer = Buffer.from(matches[2], "base64");
      }
    }

    // Cập nhật điểm cho user
    let pointsUpdateResult = {};
    if (totalAmount) {
      pointsUpdateResult = await updateUserPoints(userId, totalAmount);
      console.log(
        `User ${userId} được cộng ${pointsUpdateResult.pointsEarned} điểm, tổng điểm mới: ${pointsUpdateResult.totalPoints}`
      );
    }

    // Cập nhật trạng thái booking thành "paid" và lưu thông tin thanh toán
    booking.status = "paid";
    booking.totalAmount = totalAmount;
    booking.paymentMethod = "banking";
    booking.note = note;
    booking.paymentImage = imageBuffer;
    booking.type = "daily";
    booking.imageType = imageType;
    await booking.save();
    console.log(`Booking đã chuyển sang trạng thái paid. _id=${booking._id}, bookingCode=${booking.bookingCode}`);

    // Cập nhật số booking đã thanh toán thành công của user
    const completedCount = await updateCompletedBookingsForUser(userId);
    console.log(`User ${userId} có ${completedCount} booking đã thanh toán.`);

    // Cập nhật dữ liệu biểu đồ cho user
    await updateChartForCompleted(userId, booking.date);
    console.log(`Đã cập nhật chart data cho user ${userId} với completed +1`);

    // Cập nhật danh sách sân yêu thích của user
    await updateFavouriteCenter(userId, centerId);
    console.log(`Danh sách yêu thích của user ${userId} đã được cập nhật`);

    // Trả về kết quả
    return {
      booking,
      totalPoints: pointsUpdateResult.totalPoints,
      pointsEarned: pointsUpdateResult.pointsEarned
    };
  } catch (error) {
    console.error("Lỗi khi xác nhận và thanh toán booking:", error);
    throw error;
  }
};



// ============== HÀM XÓA PENDING TRONG CACHE ==============
export const clearAllPendingBookings = async (userId, centerId) => {
  const keys = inMemoryCache.keys();
  let deletedCount = 0;
  keys.forEach((key) => {
    // Key format: pending:{centerId}:{date}:{userId}
    if (key.startsWith(`pending:${centerId}:`) && key.endsWith(`:${userId}`)) {
      inMemoryCache.del(key);
      deletedCount++;
    }
  });
  console.log(`Đã xóa ${deletedCount} keys của booking pending cho user ${userId} tại center ${centerId}`);
  return { deletedCount };
};

// ============== HÀM GET PENDING TỪ CACHE ==============
export const getPendingMappingMemory = async (centerId, date) => {
  const keys = inMemoryCache.keys();
  const mapping = {};
  keys.forEach(key => {
    if (key.startsWith(`pending:${centerId}:${date}:`)) {
      const booking = inMemoryCache.get(key);
      if (booking) {
        booking.courts.forEach(courtBooking => {
          const courtKey = courtBooking.courtId;
          if (!mapping[courtKey]) {
            mapping[courtKey] = Array(TIMES.length - 1).fill("trống");
          }
          courtBooking.timeslots.forEach(slot => {
            const idx = slot - TIMES[0];
            if (idx >= 0 && idx < mapping[courtKey].length) {
              mapping[courtKey][idx] = { status: "pending", userId: booking.userId.toString() };
            }
          });
        });
      }
    }
  });
  return mapping;
};

// ============== HÀM GET PENDING + BOOKED TỪ DB ==============
export const getPendingMappingDB = async (centerId, date) => {
  // Bao gồm cả booking có status "pending" và "booked"
  const bookings = await Booking.find({ centerId, date, status: { $in: ["pending", "paid"] } });
  const mapping = {};
  bookings.forEach(booking => {
    booking.courts.forEach(courtBooking => {
      const courtKey = courtBooking.courtId.toString();
      if (!mapping[courtKey]) {
        mapping[courtKey] = Array(TIMES.length - 1).fill("trống");
      }
      courtBooking.timeslots.forEach(slot => {
        const idx = slot - TIMES[0];
        if (idx >= 0 && idx < mapping[courtKey].length) {
          // Nếu booking đã được chuyển sang booked thì hiển thị "đã đặt"
          mapping[courtKey][idx] = booking.status === "paid"
            ? "đã đặt"
            : { status: "pending", userId: booking.userId.toString() };
        }
      });
    });
  });
  return mapping;
};

// ============== HÀM GET FULL PENDING MAPPING ==============
export const getFullPendingMapping = async (centerId, date) => {
  const mappingCache = await getPendingMappingMemory(centerId, date);
  const mappingDB = await getPendingMappingDB(centerId, date);
  const merged = {};
  const allCourts = new Set([...Object.keys(mappingCache), ...Object.keys(mappingDB)]);
  allCourts.forEach(courtId => {
    const cacheArray = mappingCache[courtId] || Array(TIMES.length - 1).fill("trống");
    const dbArray = mappingDB[courtId] || Array(TIMES.length - 1).fill("trống");
    const mergedArray = [];
    for (let i = 0; i < cacheArray.length; i++) {
      // Ưu tiên thông tin từ DB (bao gồm cả "đã đặt")
      if (dbArray[i] !== "trống") {
        mergedArray[i] = dbArray[i];
      } else if (cacheArray[i] !== "trống") {
        mergedArray[i] = cacheArray[i];
      } else {
        mergedArray[i] = "trống";
      }
    }
    merged[courtId] = mergedArray;
  });
  return merged;
};

export const getBookingImageService = async (bookingId) => {
  if (!isValidObjectId(bookingId)) {
    throw new Error("Invalid bookingId format");
  }
  const b = new mongoose.Types.ObjectId(bookingId);
  const booking = await Booking.findById(b).lean();
  if (booking && booking.paymentImage) {
    booking.paymentImage = booking.paymentImage.toString("base64");
  }
  return booking;
};

// ============== HÀM HỦY BOOKING ==============

export const cancelBookingService = async (userId) => {
  // Tìm booking đang ở trạng thái "pending" của user
  const booking = await Booking.findOne({ userId, status: "pending" });

  if (!booking) {
    console.log(`Không tìm thấy booking pending để hủy cho user ${userId}`);
    return null;
  }

  // Chuyển trạng thái booking từ "pending" sang "cancelled"
  booking.status = "cancelled";
  await booking.save();
  console.log(`Booking của user ${userId} đã bị hủy. _id=${booking._id}, status=${booking.status}`);

  // Cập nhật số lần hủy booking của user
  const updatedUser = await markBookingAsCancelled(userId);
  console.log(`User ${userId} có ${updatedUser.stats.cancelledBookings} booking đã bị hủy.`);

  // Cập nhật dữ liệu biểu đồ (chart data)
  const dateForChart = booking.date || new Date();
  await updateChartForCancelled(userId, dateForChart);
  console.log(`Đã cập nhật chartData cho user ${userId} với cancelled +1, ngày: ${dateForChart}`);

  return booking;
};



export const getPopularTimeSlot = async (userId) => {
  // Lấy tất cả booking của user với trạng thái "booked"
  const bookings = await Booking.find({ status: "paid", userId });
  console.log(`Found ${bookings.length} booked bookings for user ${userId}`);

  // Đếm số lần xuất hiện của từng timeslot và phân loại theo khoảng thời gian
  const timeslotCounts = {};
  const categoryCounts = {
    "Sáng": 0,
    "Trưa": 0,
    "Chiều": 0,
    "Tối": 0,
  };
  let totalSlots = 0;

  // Hàm xác định khoảng thời gian từ giờ (giả sử timeslot là giờ bắt đầu)
  const getTimeCategory = (slot) => {
    const hour = parseInt(slot);
    if (hour >= 5 && hour < 12) return "Sáng";
    if (hour >= 12 && hour < 14) return "Trưa";
    if (hour >= 14 && hour < 18) return "Chiều";
    if (hour >= 18 && hour <= 24) return "Tối";
    return "Khác"; // Nếu không thuộc khoảng nào
  };

  bookings.forEach((booking, bookingIndex) => {
    console.log(`Processing booking ${bookingIndex + 1}/${bookings.length}`);
    if (booking.courts && Array.isArray(booking.courts)) {
      booking.courts.forEach((court, courtIndex) => {
        console.log(`  Processing court ${courtIndex + 1}/${booking.courts.length}`);
        if (Array.isArray(court.timeslots)) {
          court.timeslots.forEach((slot) => {
            totalSlots++;
            timeslotCounts[slot] = (timeslotCounts[slot] || 0) + 1;
            const category = getTimeCategory(slot);
            if (category in categoryCounts) {
              categoryCounts[category] += 1;
            }
            console.log(`    Slot ${slot}: totalSlots=${totalSlots}, timeslotCounts[${slot}]=${timeslotCounts[slot]}, category=${category}`);
          });
        }
      });
    }
  });

  console.log("Final timeslotCounts:", timeslotCounts);
  console.log("Final categoryCounts:", categoryCounts);
  console.log("Total slots counted:", totalSlots);

  // Tìm timeslot có số lượng lớn nhất (khung giờ phổ biến nhất)
  let popularSlot = null;
  let maxCount = 0;
  for (const slot in timeslotCounts) {
    if (timeslotCounts[slot] > maxCount) {
      maxCount = timeslotCounts[slot];
      popularSlot = slot;
    }
  }
  console.log(`Popular slot: ${popularSlot} with count: ${maxCount}`);

  // Chuyển đổi popularSlot thành khoảng thời gian (giả sử mỗi booking kéo dài 1.5 tiếng)
  let popularTimeRange = null;
  if (popularSlot !== null) {
    const startHour = parseInt(popularSlot);
    const startTime = startHour.toString().padStart(2, "0") + ":00";
    const totalTime = startHour + 1; // Giả định thời gian kéo dài 1.5 tiếng
    const endHour = Math.floor(totalTime);
    const endMinutes = (totalTime - endHour) * 60;
    const endTime = endHour.toString().padStart(2, "0") + ":" + (endMinutes === 30 ? "30" : "00");
    popularTimeRange = `${startTime} - ${endTime}`;
    console.log(`Popular time range computed as: ${popularTimeRange}`);
  }

  // Tính phần trăm phân bố theo từng khoảng thời gian
  const categoryPercentages = {};
  Object.keys(categoryCounts).forEach((cat) => {
    categoryPercentages[cat] = totalSlots > 0 ? ((categoryCounts[cat] / totalSlots) * 100).toFixed(2) : "0.00";
  });
  console.log("Category percentages:", categoryPercentages);

  return {
    popularSlot,
    popularTimeRange,
    popularCount: maxCount,
    categoryDistribution: {
      counts: categoryCounts,
      percentages: categoryPercentages,
      total: totalSlots,
    },
    timeslotCounts, // Thống kê từng slot (nếu cần hiển thị chi tiết)
  };
};




export const getBookingHistory = async (userId) => {
  try {
    // Lấy tất cả bookings của user
    const bookings = await Booking.find({ userId });

    let history = [];

    for (const booking of bookings) {
      // Lấy thông tin trung tâm
      const center = await Center.findById(booking.centerId).select("name");

      // Xử lý danh sách sân và timeslot
      const courtTimeArray = await Promise.all(
        booking.courts.map(async (court) => {
          const courtDoc = await Court.findById(court.courtId).select("name");
          return `Sân ${courtDoc ? courtDoc.name : court.courtId} - ${court.timeslots.join(", ")}`;
        })
      );
      const courtTime = courtTimeArray.join("; ");

      history.push({
        orderId: booking.status === "pending" ? booking._id : booking.bookingCode, // bookingCode nếu đã thanh toán hoặc hủy
        status: booking.status, // "pending", "paid", hoặc "cancelled"
        orderType: booking.type, // Thêm orderType
        center: center ? center.name : "Không xác định",
        court_time: courtTime,
        date: booking.date,
        price: booking.totalAmount,
        paymentMethod: booking.status === "paid" ? booking.paymentMethod : "" // Chỉ hiển thị phương thức thanh toán nếu đã thanh toán
      });
    }

    // Sắp xếp lịch sử theo ngày giảm dần (mới nhất trước)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    return history;
  } catch (error) {
    console.error("Lỗi khi lấy booking history:", error);
    throw new Error("Không thể lấy lịch sử đặt sân");
  }
};

