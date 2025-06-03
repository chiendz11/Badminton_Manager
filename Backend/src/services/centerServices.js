import mongoose from 'mongoose';
import Court from '../models/courts.js';
import Booking from '../models/bookings.js';
import Center from '../models/centers.js';

const TIMES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

export const getCourtsByCenter = async (centerId) => {
  try {
    console.log(`🔍 Nhận yêu cầu lấy sân cho centerId: ${centerId}`);
    const objectId = new mongoose.Types.ObjectId(centerId);
    const courts = await Court.find({ centerId: objectId }).lean();
    console.log(`✅ Danh sách sân:`, courts);
    return courts;
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách sân:', error.message);
    throw new Error('Không thể lấy danh sách sân');
  }
};

export const getTimeslotPrice = async (centerId, date, timeslot) => {
  if (!centerId || !date || timeslot === undefined) {
    throw new Error('Thiếu tham số: centerId, date, timeslot');
  }

  try {
    const center = await Center.findById(centerId).lean();
    if (!center) {
      throw new Error('Center not found');
    }

    if (!center.pricing || !center.pricing.weekday || !center.pricing.weekend) {
      throw new Error('Dữ liệu giá không khả dụng cho trung tâm này');
    }

    const dt = new Date(date);
    const day = dt.getDay();
    const pricingArray = day === 0 || day === 6 ? center.pricing.weekend : center.pricing.weekday;

    const slotHour = Number(timeslot);
    if (isNaN(slotHour)) {
      throw new Error('Timeslot không hợp lệ');
    }

    const bracket = pricingArray.find((br) => {
      if (!br.startTime || !br.endTime) return false;
      const start = parseInt(br.startTime.split(':')[0], 10);
      const end = parseInt(br.endTime.split(':')[0], 10);
      return slotHour >= start && slotHour < end;
    });

    if (!bracket) {
      throw new Error('Không tìm thấy khung giá cho timeslot này');
    }

    return bracket.price;
  } catch (error) {
    throw error;
  }
};

export const getCenterDetailById = async (centerId) => {
  if (!centerId) {
    throw new Error('Thiếu centerId');
  }
  try {
    const center = await Center.findById(centerId).lean();
    if (!center) {
      throw new Error('Center not found');
    }
    return center;
  } catch (error) {
    throw error;
  }
};

export const getAllCenters = async () => {
  try {
    console.log('🔍 Nhận yêu cầu lấy toàn bộ trung tâm');
    const centers = await Center.find({}).lean();
    console.log('✅ Danh sách trung tâm:', centers);

    const updatedCenters = await Promise.all(
      centers.map(async (center) => {
        const count = await updateBookingCountForCenter(center._id);
        return { ...center, bookingCount: count };
      })
    );

    return updatedCenters;
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách trung tâm:', error.message);
    throw new Error('Không thể lấy danh sách trung tâm');
  }
};

export const updateBookingCountForCenter = async (centerId) => {
  try {
    const count = await Booking.countDocuments({
      centerId: new mongoose.Types.ObjectId(centerId),
      status: 'paid',
    });
    console.log(`✅ Cập nhật bookingCount cho centerId ${centerId}: ${count}`);
    const updatedCenter = await Center.findByIdAndUpdate(
      centerId,
      { bookingCount: count },
      { new: true }
    );
    return updatedCenter.bookingCount;
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật booking count:', error.message);
    throw new Error('Không thể cập nhật booking count');
  }
};