import { togglePendingTimeslotMemory, getFullPendingMapping } from "../services/bookingServices.js";
import inMemoryCache from "./inMemoryCache.js";
import { watchBookingChanges } from "./dbChangeStream.js";

const TIMES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Danh sách rooms mà socket đã join (để rời rooms khi cần)
    const joinedRooms = new Set();

    // Xử lý sự kiện adminSelectedDates (dành riêng cho admin)
    socket.on("adminSelectedDates", ({ centerId, dates }) => {
      console.log(`Admin selected dates for center ${centerId}:`, dates);

      // Rời các rooms cũ trước khi join rooms mới
      joinedRooms.forEach((room) => {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room: ${room}`);
      });
      joinedRooms.clear();

      // Join vào các rooms tương ứng với centerId và date
      dates.forEach((date) => {
        const room = `${centerId}:${date}`; // Room name: "centerId:date"
        socket.join(room);
        joinedRooms.add(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
      });
    });

    socket.on("toggleBooking", async ({ centerId, date, courtId, colIndex, userId, username }) => {
      const timeslot = TIMES[colIndex];
      try {
        await togglePendingTimeslotMemory(username, userId, centerId, date, courtId, timeslot, 60);
        const mapping = await getFullPendingMapping(centerId, date);
        // Giữ nguyên logic cũ: gửi updateBookings đến tất cả client
        // Sửa định dạng dữ liệu để khớp với CourtStatusPage.js
        io.emit("updateBookings", { [date]: mapping });
        console.log(`Emitted updateBookings to all clients for center=${centerId}, date=${date}`);
      } catch (error) {
        console.error("Error in toggleBooking (Cache):", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      // Xóa danh sách rooms khi socket ngắt kết nối
      joinedRooms.clear();
    });
  });

  // Khi một key trong cache hết hạn, emit update
  inMemoryCache.on("expired", async (key, value) => {
    const parts = key.split(":");
    if (parts.length === 4) {
      const centerId = parts[1];
      const date = parts[2];
      console.log(`Cache key expired: ${key}. Emitting updateBookings for center=${centerId}, date=${date}`);
      const mapping = await getFullPendingMapping(centerId, date);
      // Giữ nguyên logic cũ: gửi updateBookings đến tất cả client
      io.emit("updateBookings", { [date]: mapping });
      console.log(`Emitted updateBookings to all clients for center=${centerId}, date=${date}`);
    }
  });

  // Khởi chạy Change Streams để lắng nghe thay đổi trong DB
  watchBookingChanges(io);
};