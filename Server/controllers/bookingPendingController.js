import Booking from "../models/Bookings.js";
const TIMES = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];

export const togglePendingTimeslot = async (userId, centerId, date, courtId, timeslot) => {
  let booking = await Booking.findOne({ userId, centerId, date, status: "pending" });
  if (booking) {
    const courtIndex = booking.courts.findIndex(c => c.courtId.toString() === courtId);
    if (courtIndex > -1) {
      const tsIndex = booking.courts[courtIndex].timeslots.indexOf(timeslot);
      if (tsIndex > -1) {
        booking.courts[courtIndex].timeslots.splice(tsIndex, 1);
        console.log(`Removed timeslot ${timeslot} for court ${courtId} from pending booking ${booking._id}.`);
        if (booking.courts[courtIndex].timeslots.length === 0) {
          booking.courts.splice(courtIndex, 1);
        }
        if (booking.courts.length === 0) {
          await Booking.deleteOne({ _id: booking._id });
          console.log(`Pending booking ${booking._id} deleted as no timeslot remains.`);
          return null;
        }
      } else {
        booking.courts[courtIndex].timeslots.push(timeslot);
        console.log(`Added timeslot ${timeslot} for court ${courtId} in pending booking ${booking._id}.`);
      }
    } else {
      booking.courts.push({ courtId, timeslots: [timeslot] });
      console.log(`Created new court entry for court ${courtId} with timeslot ${timeslot} in pending booking ${booking._id}.`);
    }
    await booking.save();
    console.log("Pending booking after update:", booking);
    return booking;
  } else {
    booking = new Booking({
      userId,
      centerId,
      date,
      status: "pending",
      courts: [{ courtId, timeslots: [timeslot] }]
    });
    await booking.save();
    console.log(`Created new pending booking ${booking._id} for court ${courtId} with timeslot ${timeslot}.`);
    return booking;
  }
};

export const getPendingMapping = async (centerId, date) => {
  const pendingBookings = await Booking.find({ centerId, date, status: "pending" });
  const mapping = {};
  pendingBookings.forEach(b => {
    b.courts.forEach(courtBooking => {
      const key = courtBooking.courtId.toString();
      if (!mapping[key]) {
        mapping[key] = Array(TIMES.length - 1).fill("trống");
      }
      courtBooking.timeslots.forEach(slot => {
        const idx = slot - TIMES[0];
        if (idx >= 0 && idx < mapping[key].length) {
          // Luôn trả về đối tượng pending, ép userId thành chuỗi
          mapping[key][idx] = { status: "pending", userId: b.userId.toString() };
        }
      });
    });
  });
  return mapping;
};
