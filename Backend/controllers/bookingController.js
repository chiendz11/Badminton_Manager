// src/controllers/bookingController.js
import * as bookingService from '../services/bookingServices.js';

/**
 * API tạo booking mới.
 * POST /bookings
 */
export const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;
    const booking = await bookingService.createBooking(bookingData);
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error in createBooking:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * API lấy thông tin booking theo id.
 * GET /bookings/:id
 */
export const getBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy booking' });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error('Error in getBooking:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * API lấy danh sách booking theo filter.
 * GET /bookings
 * Có thể filter theo userId, centerId, status, date (truyền qua query string).
 */
export const listBookings = async (req, res) => {
  try {
    const filter = { ...req.query };
    // Nếu ngày được truyền dưới dạng chuỗi, chuyển đổi thành Date
    if (filter.date) {
      filter.date = new Date(filter.date);
    }
    const bookings = await bookingService.listBookings(filter);
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error in listBookings:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * API cập nhật booking.
 * PUT /bookings/:id
 */
export const updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const updateData = req.body;
    const updatedBooking = await bookingService.updateBooking(bookingId, updateData);
    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    res.status(200).json(updatedBooking);
  } catch (error) {
    console.error('Error in updateBooking:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * API xóa booking.
 * DELETE /bookings/:id
 */
export const deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const deletedBooking = await bookingService.deleteBooking(bookingId);
    if (!deletedBooking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }
    res.status(200).json({ message: 'Booking đã được xóa thành công' });
  } catch (error) {
    console.error('Error in deleteBooking:', error);
    res.status(500).json({ message: error.message });
  }
};
