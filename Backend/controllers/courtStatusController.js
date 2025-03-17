// controllers/bookingController.js
import Booking from "../models/bookings.js";
const TIMES = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

export const getBookingStatus = async (req, res) => {
  const { centerId, date } = req.query;
  if (!centerId || !date) {
    return res.status(400).json({ error: "centerId and date are required" });
  }
  try {
    const bookings = await Booking.find({
      centerId,
      date,
      status: "booked"
    });
    const result = {};
    bookings.forEach(booking => {
      booking.courts.forEach(courtBooking => {
        const key = courtBooking.courtId.toString();
        if (!result[key]) {
          result[key] = Array(TIMES.length - 1).fill("trống");
        }
        courtBooking.timeslots.forEach(slot => {
          const idx = slot - TIMES[0];
          if (idx >= 0 && idx < result[key].length) {
            result[key][idx] = "đã đặt";
          }
        });
      });
    });
    res.json(result);
  } catch (error) {
    console.error("Error in getBookingStatus:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
