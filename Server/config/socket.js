import mongoose from "mongoose";
import Booking from "../models/Bookings.js";
import { togglePendingTimeslot, getPendingMapping } from "../controllers/bookingPendingController.js";

const TIMES = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
const pendingTimers = {};

const scheduleExpiration = (bookingId, io, centerId, date) => {
  if (pendingTimers[bookingId]) clearTimeout(pendingTimers[bookingId]);
  pendingTimers[bookingId] = setTimeout(async () => {
    try {
      const booking = await Booking.findById(bookingId);
      if (booking && booking.status === "pending") {
        await Booking.deleteOne({ _id: bookingId });
        console.log(`Pending booking ${bookingId} expired and deleted.`);
        const mapping = await getPendingMapping(centerId, date);
        io.emit("updateBookings", mapping);
      }
      delete pendingTimers[bookingId];
    } catch (err) {
      console.error("Error during expiration:", err);
    }
  }, 60000);
};

export const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("toggleBooking", async ({ centerId, date, courtId, colIndex, userId }) => {
      const timeslot = TIMES[colIndex];
      try {
        const currentUser = new mongoose.Types.ObjectId(userId);
        // Kiểm tra nếu ô timeslot đã được đặt bởi người khác
        const existing = await Booking.findOne({
          centerId,
          date,
          "courts": { $elemMatch: { courtId, timeslots: timeslot } },
          status: { $in: ["pending", "booked"] },
          userId: { $ne: currentUser }
        });
        if (existing) {
          console.log(`Slot ${timeslot} for court ${courtId} is already taken by another user.`);
          return;
        }
        const booking = await togglePendingTimeslot(currentUser, centerId, date, courtId, timeslot);
        if (booking && booking.status === "pending") {
          scheduleExpiration(booking._id, io, centerId, date);
        }
        const mapping = await getPendingMapping(centerId, date);
        console.log("Mapping update (raw):", JSON.stringify(mapping, null, 2));
        io.emit("updateBookings", mapping);
      } catch (error) {
        console.error("Error in toggleBooking:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};
