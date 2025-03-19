// src/services/bookingPendingService.js
import inMemoryCache from "../config/inMemoryCache.js";
import Booking from "../models/bookings.js";
import mongoose from "mongoose";

const TIMES = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

export const getPendingKey = (centerId, date, userId) => {
  return `pending:${centerId}:${date}:${userId}`;
};

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
    throw new Error("No pending booking found in cache");
  }
  const now = new Date();
  const fiveMinutesLater = new Date(now.getTime() + 1 * 60 * 1000);
  const dbBooking = new Booking({
    userId: cachedBooking.userId,
    centerId: cachedBooking.centerId,
    date: cachedBooking.date,
    status: "pending",
    courts: cachedBooking.courts,
    expiresAt: fiveMinutesLater
  });
  await dbBooking.save();
  inMemoryCache.del(key);
  console.log(`Booking pending saved to DB for date ${date} (TTL 5 phút), _id=${dbBooking._id}`);
  
  // Giả sử service getFullPendingMapping được gọi sau đó để cập nhật realtime (không cần trả về trong service này)
  return dbBooking;
};

export const bookedBookingInDB = async (userId, centerId, date) => {
  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    centerId: new mongoose.Types.ObjectId(centerId),
    date: date,
    status: "pending"
  };
  console.log("Query for bookedBookingInDB:", query);
  let booking = await Booking.findOne(query);
  if (!booking) {
    booking = await Booking.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      centerId: new mongoose.Types.ObjectId(centerId),
      date: date,
      status: "booked"
    });
    if (booking) {
      console.log("Booking already confirmed as booked.");
      return booking;
    }
    throw new Error("No pending booking found in DB");
  }
  booking.status = "booked";
  await booking.save();
  console.log(`Booking pending for date ${date} updated to booked. _id=${booking._id}`);
  return booking;
};

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
  console.log(`Cleared ${deletedCount} pending booking keys for user ${userId} at center ${centerId}`);
  return { deletedCount };
};

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
              mapping[courtKey][idx] = { status: "pending", userId: booking.userId };
            }
          });
        });
      }
    }
  });
  return mapping;
};

export const getPendingMappingDB = async (centerId, date) => {
  const pendingBookings = await Booking.find({ centerId, date, status: "pending" });
  const mapping = {};
  pendingBookings.forEach(booking => {
    booking.courts.forEach(courtBooking => {
      const courtKey = courtBooking.courtId.toString();
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
  });
  return mapping;
};

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
