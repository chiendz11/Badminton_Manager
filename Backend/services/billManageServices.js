// services/billManageServices.js
import Booking from '../models/bookings.js';
import Court from '../models/courts.js';
import User from '../models/users.js';
import Center from '../models/centers.js';

// Hàm gộp timeslots liên tiếp
const formatTimeslots = (timeslots) => {
    if (!timeslots || timeslots.length === 0) return "";

    const sortedSlots = [...timeslots].sort((a, b) => a - b);
    const ranges = [];
    let start = sortedSlots[0];
    let end = sortedSlots[0];

    for (let i = 1; i < sortedSlots.length; i++) {
        if (sortedSlots[i] === end + 1) {
            end = sortedSlots[i];
        } else {
            if (start === end) {
                ranges.push(`${start}`);
            } else {
                ranges.push(`${start}-${end}`);
            }
            start = sortedSlots[i];
            end = sortedSlots[i];
        }
    }

    if (start === end) {
        ranges.push(`${start}`);
    } else {
        ranges.push(`${start}-${end}`);
    }

    return ranges.join(", ");
};

// Hàm lấy tất cả booking và tổng hợp thông tin từ User và Center
const getAllBillsWithDetails = async () => {
    try {
        const bookings = await Booking.find()
            .populate("userId", "name")
            .populate("centerId", "name")
            .lean();

        const bills = await Promise.all(
            bookings.map(async (booking) => {
                let paymentImage = null;
                if (booking.paymentImage && booking.imageType) {
                    const base64Image = booking.paymentImage.toString("base64");
                    paymentImage = `data:${booking.imageType};base64,${base64Image}`;
                }

                const courtTimeArray = await Promise.all(
                    booking.courts.map(async (court) => {
                        const courtDoc = await Court.findById(court.courtId).select("name");
                        const courtName = courtDoc ? courtDoc.name : court.courtId;
                        const timeslotRange = formatTimeslots(court.timeslots);
                        return `Sân ${courtName}: ${timeslotRange}`;
                    })
                );
                const courtTime = courtTimeArray.join("; ");

                return {
                    _id: booking._id.toString(),
                    userName: booking.userId.name,
                    centerName: booking.centerId.name,
                    courtTime: courtTime,
                    date: booking.date,
                    status: booking.status,
                    totalAmount: booking.totalAmount,
                    paymentMethod: booking.paymentMethod,
                    bookingCode: booking.bookingCode,
                    type: booking.type,
                    note: booking.note,
                    paymentImage: paymentImage,
                    createdAt: booking.createdAt,
                };
            })
        );

        return bills;
    } catch (error) {
        throw new Error(`Lỗi khi lấy danh sách bill: ${error.message}`);
    }
};

// Service để cập nhật trạng thái bill
const updateBillStatusService = async (billId, status) => {
    try {
        const bill = await Booking.findById(billId);
        if (!bill) {
            throw new Error("Không tìm thấy bill");
        }

        // Kiểm tra trạng thái hợp lệ
        if (status === "paid" && bill.status !== "processing") {
            throw new Error("Chỉ có thể duyệt bill ở trạng thái 'processing'");
        }

        if (status === "cancelled" && bill.status !== "pending" && bill.status !== "processing") {
            throw new Error("Chỉ có thể hủy bill ở trạng thái 'pending' hoặc 'processing'");
        }

        if (status !== "paid" && status !== "cancelled") {
            throw new Error("Trạng thái không hợp lệ, chỉ có thể là 'paid' hoặc 'cancelled'");
        }

        bill.status = status;
        await bill.save();

        // Lấy thông tin chi tiết của bill sau khi cập nhật
        const updatedBill = await Booking.findById(billId)
            .populate("userId", "name")
            .populate("centerId", "name")
            .lean();

        let paymentImage = null;
        if (updatedBill.paymentImage && updatedBill.imageType) {
            const base64Image = updatedBill.paymentImage.toString("base64");
            paymentImage = `data:${updatedBill.imageType};base64,${base64Image}`;
        }

        const courtTimeArray = await Promise.all(
            updatedBill.courts.map(async (court) => {
                const courtDoc = await Court.findById(court.courtId).select("name");
                const courtName = courtDoc ? courtDoc.name : court.courtId;
                const timeslotRange = formatTimeslots(court.timeslots);
                return `Sân ${courtName}: ${timeslotRange}`;
            })
        );
        const courtTime = courtTimeArray.join("; ");

        return {
            _id: updatedBill._id.toString(),
            userName: updatedBill.userId.name,
            centerName: updatedBill.centerId.name,
            courtTime: courtTime,
            date: updatedBill.date,
            status: updatedBill.status,
            totalAmount: updatedBill.totalAmount,
            paymentMethod: updatedBill.paymentMethod,
            bookingCode: updatedBill.bookingCode,
            type: updatedBill.type,
            note: updatedBill.note,
            paymentImage: paymentImage,
            createdAt: updatedBill.createdAt,
        };
    } catch (error) {
        throw new Error(`Lỗi khi cập nhật trạng thái bill: ${error.message}`);
    }
};

// Service để tìm kiếm người dùng dựa trên username, phoneNumber, hoặc email
const searchUsersService = async (query) => {
    try {
        if (!query || typeof query !== "string") {
            throw new Error("Query tìm kiếm không hợp lệ");
        }

        // Tìm kiếm người dùng dựa trên username, phoneNumber, hoặc email (không phân biệt hoa thường)
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { phoneN_number: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
            ],
        })
            .select("_id username phone_number email name")
            .lean();

        return users.map(user => ({
            _id: user._id.toString(),
            username: user.username,
            phone_number: user.phone_number,
            email: user.email,
            name: user.name,
        }));
    } catch (error) {
        throw new Error(`Lỗi khi tìm kiếm người dùng: ${error.message}`);
    }
};

// Service để lấy danh sách tất cả trung tâm
const getAllCentersService = async () => {
    try {
        const centers = await Center.find()
            .select("_id name")
            .lean();

        return centers.map(center => ({
            _id: center._id.toString(),
            name: center.name,
        }));
    } catch (error) {
        throw new Error(`Lỗi khi lấy danh sách trung tâm: ${error.message}`);
    }
};

export { getAllBillsWithDetails, updateBillStatusService, searchUsersService, getAllCentersService };