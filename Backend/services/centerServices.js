// src/services/courtService.js
import mongoose from "mongoose";
import Court from "../models/courts.js";
import Booking from "../models/bookings.js";
import Center from "../models/centers.js";

const TIMES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

export const getCourtsByCenter = async (centerId) => {
    try {
        console.log(`🔍 Nhận request lấy sân cho centerId: ${centerId}`);
        const objectId = new mongoose.Types.ObjectId(centerId);
        const courts = await Court.find({ centerId: objectId });
        console.log(`✅ Danh sách sân:`, courts);
        return courts;
    } catch (error) {
        console.error("❌ Lỗi lấy danh sách sân:", error);
        throw error;
    }
};


export const getCourtStatus = async (centerId, date) => {
    if (!centerId || !date) {
        throw new Error("centerId and date are required");
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
        return result;
    } catch (error) {
        console.error("Error in getCourtStatusService:", error);
        throw error;
    }
};


export const getTimeslotPrice = async (centerId, date, timeslot) => {
    if (!centerId || !date || timeslot === undefined) {
        throw new Error("Missing parameters: centerId, date, timeslot");
    }

    try {
        // Tìm trung tâm theo centerId
        const center = await Center.findById(centerId);
        if (!center) {
            throw new Error("Center not found");
        }

        // Kiểm tra pricing của trung tâm
        if (!center.pricing || !center.pricing.weekday || !center.pricing.weekend) {
            throw new Error("Pricing data not available for this center");
        }

        // Xác định loại ngày: weekend nếu ngày là Chủ nhật (0) hoặc Thứ Bảy (6)
        const dt = new Date(date);
        const day = dt.getDay();
        const pricingArray = (day === 0 || day === 6) ? center.pricing.weekend : center.pricing.weekday;

        // Chuyển timeslot thành số (ví dụ: 5, 6, 17,...)
        const slotHour = Number(timeslot);
        if (isNaN(slotHour)) {
            throw new Error("Invalid timeslot");
        }

        // Tìm bảng giá có: startTime <= slotHour < endTime.
        const bracket = pricingArray.find(br => {
            if (!br.startTime || !br.endTime) return false;
            const start = parseInt(br.startTime.split(":")[0], 10);
            const end = parseInt(br.endTime.split(":")[0], 10);
            return slotHour >= start && slotHour < end;
        });

        if (!bracket) {
            throw new Error("No pricing bracket found for the given timeslot");
        }

        return bracket.price;
    } catch (error) {
        console.error("Error in getTimeslotPriceService:", error);
        throw error;
    }
};


export const getCenterDetail = async (centerId) => {
    if (!centerId) {
      throw new Error("Missing centerId");
    }
    const center = await Center.findById(centerId);
    if (!center) {
      throw new Error("Center not found");
    }
    return center;
  };
