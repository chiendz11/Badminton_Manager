// src/services/bookingService.js
import Booking from '../models/bookings.js';
import Center from '../models/centers.js';

/**
 * Tạo mã booking tự động dựa vào timestamp.
 */
const generateBookingCode = () => {
  const timestamp = new Date().getTime();
  return `#Bill${timestamp}`;
};

/**
 * Kiểm tra xem có booking nào tồn tại cho trung tâm, ngày, court và timeslot đã chọn không.
 * @param {String} centerId 
 * @param {Date} date 
 * @param {ObjectId} courtId 
 * @param {Array<Number>} timeslots 
 * @returns {Boolean} true nếu có xung đột.
 */
const checkTimeslotConflict = async (centerId, date, courtId, timeslots) => {
  // Tìm các booking có trung tâm và ngày giống nhau
  const existingBookings = await Booking.find({
    centerId,
    date,
    'courts.courtId': courtId,
  });

  // Kiểm tra từng booking đã tìm được, xem có khung giờ nào trùng nhau không.
  for (const booking of existingBookings) {
    for (const court of booking.courts) {
      if (court.courtId.toString() === courtId.toString()) {
        const conflict = court.timeslots.some(t => timeslots.includes(t));
        if (conflict) return true;
      }
    }
  }
  return false;
};

/**
 * Tạo booking mới.
 * @param {Object} bookingData Dữ liệu đặt sân từ client.
 * @returns Booking vừa được tạo.
 */
export const createBooking = async (bookingData) => {
  // Kiểm tra trung tâm có tồn tại
  const center = await Center.findById(bookingData.centerId);
  if (!center) {
    throw new Error('Trung tâm không tồn tại');
  }

  // Kiểm tra từng đối tượng trong mảng courts để xem có trùng khung giờ đã đặt không
  for (const courtBooking of bookingData.courts) {
    const isConflict = await checkTimeslotConflict(
      bookingData.centerId,
      bookingData.date,
      courtBooking.courtId,
      courtBooking.timeslots
    );
    if (isConflict) {
      throw new Error('Có thời gian trùng lặp cho sân đã chọn');
    }
  }

  // Gán mã booking nếu chưa có
  if (!bookingData.bookingCode) {
    bookingData.bookingCode = generateBookingCode();
  }

  const booking = new Booking(bookingData);
  await booking.save();
  return booking;
};

/**
 * Lấy thông tin booking theo id.
 * @param {String} bookingId 
 */
export const getBookingById = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate('centerId', 'name address phone')
    .populate('userId', 'name email');
  return booking;
};

/**
 * Lấy danh sách booking, có thể lọc theo userId, centerId, trạng thái, ngày…
 * @param {Object} filter 
 */
export const listBookings = async (filter = {}) => {
  const bookings = await Booking.find(filter)
    .populate('centerId', 'name address')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });
  return bookings;
};

/**
 * Cập nhật thông tin booking.
 * @param {String} bookingId 
 * @param {Object} updateData 
 */
export const updateBooking = async (bookingId, updateData) => {
  // Nếu update timeslot thì cần kiểm tra xung đột
  if (updateData.courts || updateData.date || updateData.centerId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking không tồn tại');
    }
    // Dùng thông tin cập nhật, trường hợp bạn muốn cho phép update timeslot
    const centerId = updateData.centerId || booking.centerId;
    const date = updateData.date || booking.date;
    const courts = updateData.courts || booking.courts;

    for (const courtBooking of courts) {
      const isConflict = await checkTimeslotConflict(
        centerId,
        date,
        courtBooking.courtId,
        courtBooking.timeslots
      );
      if (isConflict) {
        throw new Error('Có thời gian trùng lặp cho sân đã chọn');
      }
    }
  }

  const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updateData, { new: true });
  return updatedBooking;
};

/**
 * Xóa booking theo id.
 * @param {String} bookingId 
 */
export const deleteBooking = async (bookingId) => {
  const deleted = await Booking.findByIdAndDelete(bookingId);
  return deleted;
};

export const getFullPendingMapping = async (centerId, date) => {
  // Logic lấy booking pending cho center và ngày nhất định
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  
  const pendingBookings = await Booking.find({
    centerId,
    date: { $gte: dayStart, $lte: dayEnd },
    status: 'pending',
  });
  return pendingBookings;
};
/**
 * Bộ nhớ để lưu trạng thái timeslot pending theo center.
 * Cấu trúc: { [centerId]: { [timeslot]: boolean } }
 */
let pendingTimeslotMemory = {};

/**
 * Hàm chuyển đổi trạng thái của một timeslot pending cho một center.
 * Nếu toggleValue được truyền vào, nó sẽ đặt giá trị cụ thể,
 * nếu không, nó sẽ chuyển trạng thái ngược lại.
 *
 * @param {string} centerId - ID của trung tâm.
 * @param {number|string} timeslot - Khung giờ hoặc key để lưu trữ.
 * @param {boolean} [toggleValue] - Giá trị cụ thể muốn đặt.
 * @returns {boolean} - Giá trị sau khi toggle.
 */
export const togglePendingTimeslotMemory = (centerId, timeslot, toggleValue) => {
  if (!pendingTimeslotMemory[centerId]) {
    pendingTimeslotMemory[centerId] = {};
  }
  if (typeof toggleValue === 'boolean') {
    pendingTimeslotMemory[centerId][timeslot] = toggleValue;
  } else {
    // Nếu không truyền giá trị, chuyển trạng thái (true => false, false => true)
    pendingTimeslotMemory[centerId][timeslot] = !pendingTimeslotMemory[centerId][timeslot];
  }
  return pendingTimeslotMemory[centerId][timeslot];
};

export default { createBooking, getBookingById, listBookings, updateBooking, deleteBooking, getFullPendingMapping, togglePendingTimeslotMemory};
