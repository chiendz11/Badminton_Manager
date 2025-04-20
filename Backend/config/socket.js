// src/config/socket.js
import { togglePendingTimeslotMemory, getFullPendingMapping } from "../services/bookingServices.js";
import inMemoryCache from "./inMemoryCache.js";
import { watchBookingChanges } from "./dbChangeStream.js";

const TIMES = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("toggleBooking", async ({ centerId, date, courtId, colIndex, userId }) => {
      const timeslot = TIMES[colIndex];
      try {
        await togglePendingTimeslotMemory(userId, centerId, date, courtId, timeslot, 60);
        const mapping = await getFullPendingMapping(centerId, date);
        io.emit("updateBookings", { date, mapping });
      } catch (error) {
        console.error("Error in toggleBooking (Cache):", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  inMemoryCache.on("expired", async (key, value) => {
    const parts = key.split(":");
    if (parts.length === 4) {
      const centerId = parts[1];
      const date = parts[2];
      console.log(`Cache key expired: ${key}. Emitting updateBookings for center=${centerId}, date=${date}`);
      const mapping = await getFullPendingMapping(centerId, date);
      io.emit("updateBookings", { date, mapping });
    }
  });

  // Khởi chạy Change Streams để lắng nghe thay đổi trong DB
  watchBookingChanges(io);
};
