import inMemoryCache from "../config/inMemoryCache.js";
import Booking from "../models/bookings.js";
import mongoose from "mongoose";
import Center from "../models/centers.js";
import Court from "../models/courts.js";
import { updateFavouriteCenter, updateCompletedBookingsForUser, markBookingAsCancelled, incrementTotalBookings, updateUserPoints, updateChartForCancelled, updateChartForCompleted } from "./userServices.js";

// ============== CÁC CONSTANT VÀ HÀM PHỤ TRỢ ==============
const TIMES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

export const getPendingKey = (centerId, date, userId, name) => {
  return `pending:${centerId}:${date}:${userId}:${name}`;
};

// ============== HÀM CHUYỂN ĐỔI TIMESLOT TRONG CACHE ==============
export const togglePendingTimeslotMemory = async (name, userId, centerId, date, courtId, timeslot, ttl = 60) => {
  const key = getPendingKey(centerId, date, userId, name);
  let booking = inMemoryCache.get(key) || {
    name: name,
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
export const pendingBookingToDB = async (userId, centerId, date, totalAmount, name) => {
  const exists = await Booking.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    centerId: new mongoose.Types.ObjectId(centerId),
    status: "pending"
  });
  if (exists) {
    throw new Error("Bạn đã có booking pending trên trung tâm này. Vui lòng chờ hết 5 phút trước khi đặt thêm.");
  }

  const key = getPendingKey(centerId, date, userId, name);
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
  console.log(`Updated totalBookings for user ${name}: ${updatedTotal}`);

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
    const query = {
      userId: new mongoose.Types.ObjectId(userId),
      centerId: new mongoose.Types.ObjectId(centerId),
      date: date,
      status: "pending"
    };
    let booking = await Booking.findOne(query);
    if (!booking) {
      booking = await Booking.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        centerId: new mongoose.Types.ObjectId(centerId),
        date: date,
        status: "processing"
      });
      if (booking) {
        console.log("Booking đã được thanh toán trước đó.");
        return booking;
      }
      throw new Error("Không tìm thấy booking pending trong DB");
    }

    let imageBuffer = null;
    let imageType = "image/jpeg";
    if (paymentImage) {
      const matches = paymentImage.match(/^data:(.*);base64,(.*)$/);
      if (matches && matches.length === 3) {
        imageType = matches[1];
        imageBuffer = Buffer.from(matches[2], "base64");
      }
    }

    let pointsUpdateResult = {};
    if (totalAmount) {
      pointsUpdateResult = await updateUserPoints(userId, totalAmount);
      console.log(
        `User ${userId} được cộng ${pointsUpdateResult.pointsEarned} điểm, tổng điểm mới: ${pointsUpdateResult.totalPoints}`
      );
    }

    booking.status = "processing";
    booking.totalAmount = totalAmount;
    booking.paymentMethod = "banking";
    booking.note = note;
    booking.paymentImage = imageBuffer;
    booking.type = "daily";
    booking.imageType = imageType;
    await booking.save();
    console.log(`Booking đã chuyển sang trạng thái paid. _id=${booking._id}, bookingCode=${booking.bookingCode}`);

    const completedCount = await updateCompletedBookingsForUser(userId);
    console.log(`User ${userId} có ${completedCount} booking đã thanh toán, hãy chờ để Admin duyệt.`);

    await updateChartForCompleted(userId, booking.date);
    console.log(`Đã cập nhật chart data cho user ${userId} với completed +1`);

    await updateFavouriteCenter(userId, centerId);
    console.log(`Danh sách yêu thích của user ${userId} đã được cập nhật`);

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
    if (key.startsWith(`pending:${centerId}:`) && key.includes(`:${userId}:`)) {
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
              mapping[courtKey][idx] = {
                status: "pending",
                userId: booking.userId.toString(),
                name: booking.name || "Không xác định"
              };
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
  // Chuẩn hóa tham số date
  let queryDate;
  if (typeof date === "string") {
    queryDate = new Date(date);
  } else if (date instanceof Date) {
    queryDate = new Date(date);
  } else {
    throw new Error("Tham số date không hợp lệ");
  }

  // Chuẩn hóa về UTC và đặt giờ về 00:00:00.000
  queryDate.setUTCHours(0, 0, 0, 0);

  // Tính ngày kết thúc (cuối ngày queryDate)
  const endDate = new Date(queryDate);
  endDate.setUTCHours(23, 59, 59, 999);

  console.log(`getPendingMappingDB - Tham số date: ${date}`);
  console.log(`getPendingMappingDB - Chuẩn hóa date: ${queryDate.toISOString()}`);
  console.log(`getPendingMappingDB - Khoảng thời gian truy vấn: từ ${queryDate.toISOString()} đến ${endDate.toISOString()}`);

  // Truy vấn booking trong khoảng thời gian
  const bookings = await Booking.find({
    centerId,
    date: {
      $gte: queryDate,
      $lte: endDate
    },
    status: { $in: ["pending", "paid", "processing"] },
    deleted: false // Thêm điều kiện để đảm bảo không lấy booking đã xóa
  }).populate("userId", "name").lean();

  console.log(`getPendingMappingDB - Bookings tìm thấy (${bookings.length}):`, bookings.map(b => ({
    _id: b._id,
    date: b.date,
    status: b.status,
    type: b.type,
    courts: b.courts
  })));

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
          if (booking.status === "paid") {
            mapping[courtKey][idx] = {
              status: "đã đặt",
              userId: booking.userId.toString(),
              name: booking.userId?.name || "Không xác định"
            };
          } else if (booking.status === "pending") {
            mapping[courtKey][idx] = {
              status: "pending",
              userId: booking.userId.toString(),
              name: booking.userId?.name || "Không xác định"
            };
          } else if (booking.status === "processing") {
            mapping[courtKey][idx] = {
              status: "chờ xử lý",
              userId: booking.userId.toString(),
              name: booking.userId?.name || "Không xác định"
            };
          }
        }
      });
    });
  });

  console.log(`Mapping cho center ${centerId}, ngày ${queryDate.toISOString()}:`, mapping);
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
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
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
  const booking = await Booking.findOne({ userId, status: "pending" });

  if (!booking) {
    console.log(`Không tìm thấy booking pending để hủy cho user ${userId}`);
    return null;
  }

  booking.status = "cancelled";
  await booking.save();
  console.log(`Booking của user ${userId} đã bị hủy. _id=${booking._id}, status=${booking.status}`);

  const updatedUser = await markBookingAsCancelled(userId);
  console.log(`User ${userId} có ${updatedUser.stats.cancelledBookings} booking đã bị hủy.`);

  const dateForChart = booking.date || new Date();
  await updateChartForCancelled(userId, dateForChart);
  console.log(`Đã cập nhật chartData cho user ${userId} với cancelled +1, ngày: ${dateForChart}`);

  return booking;
};

// ============== HÀM XÓA BOOKING (XÓA MỀM) ==============
export const deleteBookingService = async (bookingId) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new Error("Invalid bookingId format");
  }
  const b = new mongoose.Types.ObjectId(bookingId);
  const booking = await Booking.findOne({ _id: b, status: "paid" });
  if (!booking) {
    console.log(`Không tìm thấy booking paid với _id ${bookingId} để xóa`);
    return null;
  }

  booking.deleted = true;
  await booking.save();
  console.log(`Booking với _id ${bookingId} đã được đánh dấu xóa mềm (deleted: true)`);

  return booking;
};

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

  let popularSlot = null;
  let maxCount = 0;
  for (const slot in timeslotCounts) {
    if (timeslotCounts[slot] > maxCount) {
      maxCount = timeslotCounts[slot];
      popularSlot = slot;
    }
  }
  console.log(`Popular slot: ${popularSlot} with count: ${maxCount}`);

  let popularTimeRange = null;
  if (popularSlot !== null) {
    const startHour = parseInt(popularSlot);
    const startTime = startHour.toString().padStart(2, "0") + ":00";
    const totalTime = startHour + 1;
    const endHour = Math.floor(totalTime);
    const endMinutes = (totalTime - endHour) * 60;
    const endTime = endHour.toString().padStart(2, "0") + ":" + (endMinutes === 30 ? "30" : "00");
    popularTimeRange = `${startTime} - ${endTime}`;
    console.log(`Popular time range computed as: ${popularTimeRange}`);
  }

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
    timeslotCounts,
  };
};

export const getBookingHistory = async (userId) => {
  try {
    const bookings = await Booking.find({ userId, deleted: { $ne: true } });

    let history = [];

    for (const booking of bookings) {
      const center = await Center.findById(booking.centerId).select("name");

      const courtTimeArray = await Promise.all(
        booking.courts.map(async (court) => {
          const courtDoc = await Court.findById(court.courtId).select("name");
          return `${courtDoc ? courtDoc.name : court.courtId} - ${court.timeslots.join(", ")}`;
        })
      );
      const courtTime = courtTimeArray.join("; ");

      history.push({
        bookingId: booking._id, // Thêm bookingId là _id
        orderId: booking.status === "pending" ? booking._id : booking.bookingCode, // Giữ nguyên orderId
        status: booking.status,
        orderType: booking.type,
        center: center ? center.name : "Không xác định",
        court_time: courtTime,
        date: booking.date,
        price: booking.totalAmount,
        paymentMethod: booking.status === "paid" ? booking.paymentMethod : ""
      });
    }

    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    return history;
  } catch (error) {
    console.error("Lỗi khi lấy booking history:", error);
    throw new Error("Không thể lấy lịch sử đặt sân");
  }
};