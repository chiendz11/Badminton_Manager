// src/services/bookingPendingService.js

import inMemoryCache from "../config/inMemoryCache.js";
import Booking from "../models/bookings.js";
import mongoose from "mongoose";
import Bill from "../models/bills.js";
import { updateBookingCountForCenter } from "../services/centerServices.js";

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
export const pendingBookingToDB = async (userId, centerId, date) => {
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
  const now = new Date();
  const dbBooking = new Booking({
    userId: cachedBooking.userId,
    centerId: cachedBooking.centerId,
    date: cachedBooking.date,
    status: "pending",
    courts: cachedBooking.courts,
  });
  await dbBooking.save();
  inMemoryCache.del(key);
  console.log(`Booking pending lưu vào DB cho ngày ${date} (TTL 5 phút), _id=${dbBooking._id}`);

  return dbBooking;
};

// ============== HÀM CHUYỂN TỪ PENDING SANG BOOKED ==============
export const bookedBookingInDB = async (userId, centerId, date, note = "") => {
  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    centerId: new mongoose.Types.ObjectId(centerId),
    date: date,
    status: "pending"
  };
  console.log("Query for bookedBookingInDB:", query);

  let booking = await Booking.findOne(query);
  if (!booking) {
    // Kiểm tra xem booking đã là booked hay chưa
    booking = await Booking.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      centerId: new mongoose.Types.ObjectId(centerId),
      date: date,
      status: "booked"
    });
    if (booking) {
      console.log("Booking đã được xác nhận là booked.");
      return booking;
    }
    throw new Error("Không tìm thấy booking pending trong DB");
  }

  // Chuyển trạng thái từ pending sang booked
  booking.status = "booked";
  // Gán note (nếu có)
  booking.note = note;
  await booking.save();
  const updatedCount = await updateBookingCountForCenter(centerId);
  console.log(`Booking pending chuyển sang booked. _id=${booking._id} - Booking count updated: ${updatedCount}`);
  // Trả về booking (không gọi createBill ở đây)
  return booking;
};

// ============== HÀM TẠO BILL SAU KHI BOOKING ĐƯỢC XÁC NHẬN ==============
export const createBillService = async ({ userId, centerId, bookingId, totalAmount, paymentImage, note = "" }) => {
  let imageBuffer = null;
  let imageType = "image/jpeg"; // Giá trị mặc định nếu không nhận được MIME type từ paymentImage
  if (paymentImage) {
    // paymentImage dạng Data URL: "data:image/jpeg;base64,...."
    const matches = paymentImage.match(/^data:(.*);base64,(.*)$/);
    if (matches && matches.length === 3) {
      imageType = matches[1]; // Ví dụ: "image/jpeg" hoặc "image/png"
      const base64Data = matches[2];
      imageBuffer = Buffer.from(base64Data, "base64");
    }
  }

  const newBill = new Bill({
    userId: new mongoose.Types.ObjectId(userId),
    centerId: new mongoose.Types.ObjectId(centerId),
    bookings: [bookingId],
    totalAmount,
    paymentMethod: "banking",
    paymentStatus: "pending", // hoặc "paid" nếu thanh toán đã được xác nhận
    orderType: "daily",
    note, // Gán note vào bill
    paymentImage: imageBuffer,
    paymentImageType: imageType,
  });

  await newBill.save();
  return newBill;
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
  const bookings = await Booking.find({ centerId, date, status: { $in: ["pending", "booked"] } });
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
          mapping[courtKey][idx] = booking.status === "booked"
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

export const getBillService = async (billId) => {
  const b = new mongoose.Types.ObjectId(billId);
  const bill = await Bill.findById(b).lean();
  if (bill && bill.paymentImage) {
    bill.paymentImage = bill.paymentImage.toString("base64");
  }
  return bill;
};
