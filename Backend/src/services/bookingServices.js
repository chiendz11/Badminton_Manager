// bookingServices.js
import inMemoryCache from "../config/inMemoryCache.js";
import Booking from "../models/bookings.js";
import mongoose from "mongoose";
import Center from "../models/centers.js";
import Court from "../models/courts.js";
import { updateFavouriteCenter, updateCompletedBookingsForUser, markBookingAsCancelled, incrementTotalBookings, updateChartForCancelled, updateChartForCompleted } from "./userServices.js";

// ============== CÁC CONSTANT VÀ HÀM PHỤ TRỢ ==============
const TIMES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

export const getPendingKey = (centerId, date, userId, name) => {
  // Ensure consistency: use userId (string) for cache key
  // The name part is important for the key if frontend uses it for display/grouping
  return `pending:${centerId}:${date}:${userId}:${name}`;
};

// ============== HÀM CHUYỂN ĐỔI TIMESLOT TRONG CACHE ==============
export const togglePendingTimeslotMemory = async (name, userId, centerId, date, courtId, timeslot, ttl = 60) => {
  // IMPORTANT: For a robust system, this function should also check DB for conflicts
  // before allowing a toggle, or at least return a flag if a conflict is detected.
  // For now, we rely on the final check in pendingBookingToDB.

  const key = getPendingKey(centerId, date, userId, name);
  let booking = inMemoryCache.get(key) || {
    name: name,
    userId: userId, // Ensure userId is stored as string here for cache consistency
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

// ============== HÀM LƯU BOOKING PENDING VÀO DB (VỚI TRANSACTION) ==============
export const pendingBookingToDB = async (userId, centerId, date, totalAmount, name) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const objectCenterId = new mongoose.Types.ObjectId(centerId);
    const bookingDate = new Date(date); // Ensure date is a Date object

    // 1. Kiểm tra booking pending hiện có của user này (ngoài cache)
    const existingPendingBooking = await Booking.findOne({
      userId: objectUserId,
      centerId: objectCenterId,
      date: bookingDate, // Thêm điều kiện date để kiểm tra pending booking cho ngày cụ thể
      status: "pending"
    }).session(session);

    if (existingPendingBooking) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("Bạn đã có booking pending trên trung tâm này. Vui lòng chờ hết 5 phút trước khi đặt thêm.");
    }

    // 2. Lấy booking từ cache
    const key = getPendingKey(centerId, date, userId, name);
    const cachedBooking = inMemoryCache.get(key);
    if (!cachedBooking) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("Không tìm thấy booking pending trong cache");
    }

    // 3. Kiểm tra tính khả dụng của timeslot trong DB (Atomic Check)
    // Lấy tất cả các timeslot mà user đang cố gắng đặt
    const requestedCourtTimeslots = cachedBooking.courts.reduce((acc, court) => {
        court.timeslots.forEach(slot => {
            acc.push({ courtId: new mongoose.Types.ObjectId(court.courtId), timeslot: slot });
        });
        return acc;
    }, []);

    // Tìm kiếm các booking khác (pending của người khác, processing, paid)
    // cho cùng center, ngày và các timeslot/court đang được yêu cầu
    const conflictingBookings = await Booking.find({
      centerId: objectCenterId,
      date: bookingDate,
      status: { $in: ["pending", "processing", "paid"] }, // Bao gồm cả pending của người khác
      deleted: false,
      // $or condition to check for any overlap in courts and timeslots
      $or: requestedCourtTimeslots.map(reqSlot => ({
        "courts": {
          $elemMatch: {
            courtId: reqSlot.courtId,
            timeslots: reqSlot.timeslot
          }
        }
      }))
    }).session(session); // Đảm bảo truy vấn này nằm trong transaction session

    if (conflictingBookings.length > 0) {
      // Logic chi tiết hơn để kiểm tra trùng lặp từng timeslot
      for (const conflictBooking of conflictingBookings) {
        // Bỏ qua booking pending của chính user hiện tại nếu có (đã kiểm tra ở trên)
        if (conflictBooking.userId.toString() === userId && conflictBooking.status === "pending") {
            continue;
        }
        for (const requestedCourt of cachedBooking.courts) {
          for (const requestedTimeslot of requestedCourt.timeslots) {
            for (const existingCourt of conflictBooking.courts) {
              if (existingCourt.courtId.toString() === requestedCourt.courtId.toString()) { // Ensure comparison is string to string
                if (existingCourt.timeslots.includes(requestedTimeslot)) {
                  // Timeslot đã bị đặt bởi booking khác
                  await session.abortTransaction(); // Hủy bỏ toàn bộ transaction
                  session.endSession();
                  throw new Error(`Timeslot ${requestedTimeslot} trên sân ${existingCourt.courtId} đã được đặt bởi người khác.`);
                }
              }
            }
          }
        }
      }
    }

    // 4. Tạo và lưu booking mới vào DB
    const dbBooking = new Booking({
      userId: objectUserId, // Đảm bảo userId là ObjectId
      centerId: objectCenterId, // Đảm bảo centerId là ObjectId
      date: bookingDate, // Đảm bảo date là Date object
      status: "pending",
      totalAmount: totalAmount,
      courts: cachedBooking.courts.map(court => ({
          courtId: new mongoose.Types.ObjectId(court.courtId), // Chuyển courtId thành ObjectId
          timeslots: court.timeslots
      })),
      // bookingCode sẽ được sinh ra bởi pre('save') middleware
    });
    await dbBooking.save({ session }); // Lưu trong session của transaction

    // 5. Xóa khỏi cache
    inMemoryCache.del(key);
    console.log(`Đặt sân thành công! Đã lưu vào DB đơn giữ chỗ _id=${dbBooking.bookingCode}`);
    const updatedTotal = await incrementTotalBookings(userId);
    console.log(`Updated totalBookings for user ${name}: ${updatedTotal}`);

    await session.commitTransaction();
    session.endSession();
    return dbBooking;

  } catch (error) {
    // Đảm bảo session chưa bị hủy trước khi gọi abortTransaction()
    // Mongoose 6+ có thể tự động abort transaction khi lỗi xảy ra,
    // nhưng việc gọi lại abortTransaction() sẽ gây ra lỗi "Cannot call abortTransaction twice".
    // Cách an toàn nhất là bọc nó trong một try-catch riêng.
    try {
      if (session.inTransaction()) { // Kiểm tra xem session còn trong transaction không
        await session.abortTransaction();
      }
    } catch (abortError) {
      console.error("Error during transaction abort:", abortError);
    } finally {
      session.endSession();
    }
    console.error("Error confirming booking to DB (Service - Transaction aborted):", error);
    throw error; // Re-throw the original error to be caught by the controller
  }
};

export const bookedBookingInDB = async ({
  userId,
  centerId,
  date,
  totalAmount,
  paymentImage,
  note = ""
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const objectCenterId = new mongoose.Types.ObjectId(centerId);
    const bookingDate = new Date(date); // Ensure date is a Date object
    const MAX_NOTE_WORDS = 500;
    const words = note.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length > MAX_NOTE_WORDS) {
      throw new Error(`Ghi chú không được vượt quá ${MAX_NOTE_WORDS} từ.`);
    }

    const query = {
      userId: objectUserId,
      centerId: objectCenterId,
      date: bookingDate,
      status: "pending"
    };
    let booking = await Booking.findOne(query).session(session);

    if (!booking) {
      // Check if it's already processing/paid (in case of retry or race condition)
      booking = await Booking.findOne({
        userId: objectUserId,
        centerId: objectCenterId,
        date: bookingDate,
        status: { $in: ["processing", "paid"] }
      }).session(session);
      if (booking) {
        await session.commitTransaction(); // Commit transaction if already processed
        session.endSession();
        console.log("Booking đã được thanh toán hoặc đang chờ xử lý trước đó.");
        return { booking }; // Return existing booking if already processed
      }
      await session.abortTransaction();
      session.endSession();
      throw new Error("Không tìm thấy booking pending trong DB");
    }
    const requestedCourtTimeslots = booking.courts.reduce((acc, court) => {
        court.timeslots.forEach(slot => {
            acc.push({ courtId: new mongoose.Types.ObjectId(court.courtId), timeslot: slot });
        });
        return acc;
    }, []);

    const conflictingBookings = await Booking.find({
      centerId: objectCenterId,
      date: bookingDate,
      status: { $in: ["processing", "paid"] }, // Only check against finalized bookings
      deleted: false,
      _id: { $ne: booking._id }, // Exclude the current booking being processed
      $or: requestedCourtTimeslots.map(reqSlot => ({
        "courts": {
          $elemMatch: {
            courtId: reqSlot.courtId,
            timeslots: reqSlot.timeslot
          }
        }
      }))
    }).session(session);

    if (conflictingBookings.length > 0) {
      // If there's a conflict, abort and inform
      await session.abortTransaction();
      session.endSession();
      throw new Error("Timeslot đã bị đặt bởi người khác trong lúc bạn thanh toán. Vui lòng kiểm tra lại.");
    }


    let imageBuffer = null;
    let imageType = "image/jpeg"; // Giá trị mặc định

    if (paymentImage) {
      const matches = paymentImage.match(/^data:(.*);base64,(.*)$/);

      if (!matches || matches.length !== 3) {
        throw new Error("Dữ liệu ảnh thanh toán không đúng định dạng Base64.");
      }

      imageType = matches[1]; // Ví dụ: "image/png"
      imageBuffer = Buffer.from(matches[2], "base64"); // Dữ liệu nhị phân của ảnh

      // Định nghĩa các loại MIME và kích thước tối đa cho phép ở SERVER
      const ALLOWED_SERVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
      const MAX_SERVER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // Ví dụ: 5MB

      if (!ALLOWED_SERVER_MIME_TYPES.includes(imageType)) {
        throw new Error("Định dạng ảnh không được hỗ trợ. Vui lòng sử dụng JPG, PNG, hoặc GIF.");
      }

      if (imageBuffer.length > MAX_SERVER_IMAGE_SIZE_BYTES) {
        throw new Error(`Kích thước ảnh vượt quá giới hạn ${MAX_SERVER_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`);
      }
    }

    booking.status = "processing";
    booking.totalAmount = totalAmount;
    booking.paymentMethod = "banking";
    booking.note = note;
    booking.paymentImage = imageBuffer;
    booking.type = "daily"; // Assuming it's daily booking
    booking.imageType = imageType;
    // bookingCode should be generated by pre('save') middleware if not already there
    // For existing pending bookings, bookingCode might be null if not generated before.
    // The pre('save') middleware should handle generating it when status changes from 'pending' to 'processing'.
    await booking.save({ session }); // Save in session of transaction
    console.log(`Booking đã chuyển sang trạng thái processing. _id=${booking._id}, bookingCode=${booking.bookingCode}`);

    // Update user stats (these can be outside the core transaction if less critical for atomicity)
    // For simplicity, keeping them inside for now.
    const completedCount = await updateCompletedBookingsForUser(userId);
    console.log(`User ${userId} có ${completedCount} booking đã thanh toán, hãy chờ để Admin duyệt.`);

    await updateChartForCompleted(userId, booking.date);
    console.log(`Đã cập nhật chart data cho user ${userId} với completed +1`);

    await updateFavouriteCenter(userId, centerId);
    console.log(`Danh sách yêu thích của user ${userId} đã được cập nhật`);

    await session.commitTransaction();
    session.endSession();
    return { booking };
  } catch (error) {
    // Đảm bảo session chưa bị hủy trước khi gọi abortTransaction()
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortError) {
      console.error("Error during transaction abort:", abortError);
    } finally {
      session.endSession();
    }
    console.error("Lỗi khi xác nhận và thanh toán booking (Service - Transaction aborted):", error);
    throw error;
  }
};

// ============== HÀM XÓA PENDING TRONG CACHE ==============
export const clearAllPendingBookings = async (userId, centerId) => {
  const keys = inMemoryCache.keys();
  let deletedCount = 0;
  keys.forEach((key) => {
    // Ensure key format matches getPendingKey
    if (key.startsWith(`pending:${centerId}:`) && key.includes(`:${userId}:`)) {
      inMemoryCache.del(key);
      deletedCount++;
    }
  });
  console.log(`Đã xóa ${deletedCount} keys của booking pending cho user ${userId} tại center ${centerId}`);
  return { deletedCount };
};

// ============== HÀM GET PENDING TỪ CACHE (DÙNG CHO MY PENDING) ==============
export const getMyPendingTimeslots = async (centerId, date, userId) => {
  const keys = inMemoryCache.keys();
  const mapping = {};

  keys.forEach(key => {
    // Ensure key format matches getPendingKey
    if (key.startsWith(`pending:${centerId}:${date}:${userId}:`)) {
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
                status: "myPending",
                userId: booking.userId.toString(), // Ensure userId is string for consistency
                name: booking.name || "Không xác định"
              };
            }
          });
        });
      }
    }
  });

  console.log(`getMyPendingTimeslots - Mapping cho user ${userId}:`, mapping);
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
  const mappingDB = await getPendingMappingDB(centerId, date);
  return mappingDB;
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
        console.log(`   Processing court ${courtIndex + 1}/${booking.courts.length}`);
        if (Array.isArray(court.timeslots)) {
          court.timeslots.forEach((slot) => {
            totalSlots++;
            timeslotCounts[slot] = (timeslotCounts[slot] || 0) + 1;
            const category = getTimeCategory(slot);
            if (category in categoryCounts) {
              categoryCounts[category] += 1;
            }
            console.log(`     Slot ${slot}: totalSlots=${totalSlots}, timeslotCounts[${slot}]=${timeslotCounts[slot]}, category=${category}`);
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

export const getBookingHistory = async (userId, page = 1, limit = 10) => {
  try {
    // Chuyển page và limit thành số nguyên
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Lấy tổng số bản ghi để tính tổng số trang
    const totalBookings = await Booking.countDocuments({ userId, deleted: { $ne: true } });

    // Lấy dữ liệu với phân trang
    const bookings = await Booking.find({ userId, deleted: { $ne: true } })
      .skip(skip)
      .limit(limitNum)
      .sort({ date: -1 }); // Sắp xếp theo ngày mới nhất

    // Tách daily và fixed bookings
    const dailyBookings = bookings.filter((booking) => booking.type === "daily");
    const fixedBookings = bookings.filter((booking) => booking.type === "fixed");

    let history = [];

    // Xử lý daily bookings
    for (const booking of dailyBookings) {
      const center = await Center.findById(booking.centerId).select("name");

      const courtTimeArray = await Promise.all(
        booking.courts.map(async (court) => {
          const courtDoc = await Court.findById(court.courtId).select("name");
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

    // Gộp fixed bookings
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
      const center = await Center.findById(group.centerId).select("name");

      const courtTimeArray = await Promise.all(
        group.courts.map(async (court) => {
          const courtDoc = await Court.findById(court.courtId).select("name");
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

    // Sắp xếp history theo ngày
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
