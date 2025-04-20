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
                    try {
                        const base64Image = Buffer.isBuffer(booking.paymentImage)
                            ? booking.paymentImage.toString("base64")
                            : booking.paymentImage.toString("base64");
                        const validMimeTypes = ["image/jpeg", "image/png", "image/gif"];
                        const mimeType = validMimeTypes.includes(booking.imageType)
                            ? booking.imageType
                            : "image/jpeg";
                        paymentImage = `data:${mimeType};base64,${base64Image}`;
                    } catch (error) {
                        console.error(`Lỗi khi xử lý paymentImage cho booking ${booking._id}:`, error);
                        paymentImage = null;
                    }
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

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { phone_number: { $regex: query, $options: "i" } },
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

// Service để lấy danh sách sân trống
const getAvailableCourts = async ({ centerId, startDate, timeslots, daysOfWeek }) => {
    try {
        console.log('getAvailableCourts - Input:', {
            centerId,
            startDate: startDate.toISOString(),
            timeslots,
            daysOfWeek
        });

        if (!centerId || !startDate || !timeslots || !daysOfWeek || timeslots.length === 0 || daysOfWeek.length === 0) {
            throw new Error("Thiếu tham số bắt buộc: centerId, startDate, timeslots, hoặc daysOfWeek");
        }

        // Tính ngày kết thúc (30 ngày sau ngày bắt đầu)
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);
        console.log('getAvailableCourts - Time range:', {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        // Lấy danh sách sân của trung tâm
        const courts = await Court.find({ centerId }).select("_id name").lean();
        console.log('getAvailableCourts - Courts found:', courts);
        if (!courts.length) {
            console.log('getAvailableCourts - No courts found for center');
            return {};
        }

        // Lấy danh sách booking trong khoảng thời gian
        const bookings = await Booking.find({
            centerId,
            date: { $gte: startDate, $lte: endDate },
            status: { $in: ["paid", "pending", "processing"] },
        }).lean();
        console.log('getAvailableCourts - Bookings found:', bookings);

        // Tạo object lưu sân trống theo dayOfWeek
        const availableCourtsByDay = {};
        daysOfWeek.forEach((dayOfWeek) => {
            availableCourtsByDay[dayOfWeek] = [];
        });

        for (const court of courts) {
            console.log(`getAvailableCourts - Checking court: ${court.name} (${court._id})`);

            // Kiểm tra từng ngày trong tuần đã chọn
            for (const dayOfWeek of daysOfWeek) {
                let isAvailable = true;

                // Tìm tất cả các ngày tương ứng với dayOfWeek trong khoảng thời gian
                const relevantDays = [];
                let currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    if (currentDate.getDay() === dayOfWeek) {
                        relevantDays.push(new Date(currentDate));
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                console.log(`getAvailableCourts - Relevant days for dayOfWeek ${dayOfWeek}:`, relevantDays.map(d => d.toISOString()));

                // Kiểm tra từng khung giờ
                for (const timeslot of timeslots) {
                    const [hour] = timeslot.split(":");
                    const startHour = parseInt(hour);
                    const endHour = startHour + 1;
                    console.log(`getAvailableCourts - Checking timeslot ${timeslot} (startHour: ${startHour}, endHour: ${endHour})`);

                    // Kiểm tra xem sân có bị đặt hoặc đang chờ duyệt trong bất kỳ ngày nào không
                    for (const day of relevantDays) {
                        const conflictingBookings = bookings.filter((booking) => {
                            const bookingDate = new Date(booking.date);
                            return (
                                bookingDate.toDateString() === day.toDateString() &&
                                booking.courts.some((c) => c.courtId.toString() === court._id.toString()) &&
                                booking.courts.some((c) =>
                                    c.timeslots.some((slot) => slot >= startHour && slot < endHour)
                                )
                            );
                        });

                        if (conflictingBookings.length > 0) {
                            console.log(`getAvailableCourts - Conflicting bookings found for court ${court.name} on ${day.toISOString()}:`, conflictingBookings);
                            isAvailable = false;
                            break;
                        }
                    }
                    if (!isAvailable) break;
                }

                if (isAvailable) {
                    console.log(`getAvailableCourts - Court ${court.name} is available for dayOfWeek ${dayOfWeek}`);
                    availableCourtsByDay[dayOfWeek].push({
                        _id: court._id.toString(),
                        name: court.name,
                    });
                }
            }
        }

        console.log('getAvailableCourts - Final available courts:', availableCourtsByDay);
        return availableCourtsByDay;
    } catch (error) {
        console.error('getAvailableCourts - Error:', error.message);
        throw new Error(`Lỗi khi lấy danh sách sân trống: ${error.message}`);
    }
};

// Service để tạo nhiều booking cố định (fixed)
const createFixedBookings = async ({ userId, centerId, bookings, type }) => {
    try {
        console.log('createFixedBookings - Input:', { userId, centerId, bookings, type });

        // Kiểm tra tham số đầu vào
        if (!userId || !centerId || !bookings || !Array.isArray(bookings) || bookings.length === 0 || !type) {
            throw new Error("Thiếu tham số bắt buộc: userId, centerId, bookings, hoặc type");
        }

        if (type !== "fixed") {
            throw new Error("Loại booking không hợp lệ, phải là 'fixed'");
        }

        // Kiểm tra user và center có tồn tại không
        const user = await User.findById(userId).lean();
        if (!user) {
            throw new Error("Không tìm thấy người dùng");
        }
        console.log('createFixedBookings - User found:', user);

        const center = await Center.findById(centerId).lean();
        if (!center) {
            throw new Error("Không tìm thấy trung tâm");
        }
        console.log('createFixedBookings - Center found:', center);

        // Lấy danh sách tất cả sân của trung tâm
        const courts = await Court.find({ centerId }).select("_id").lean();
        const courtIds = courts.map(court => court._id.toString());
        console.log('createFixedBookings - Courts in center:', courtIds);

        // Kiểm tra tính hợp lệ của bookings
        const bookingDates = [];
        for (const booking of bookings) {
            let { date, courtId, timeslots } = booking;

            // Kiểm tra định dạng
            if (!date || !courtId || !timeslots || !Array.isArray(timeslots) || timeslots.length === 0) {
                throw new Error("Booking không hợp lệ: Thiếu date, courtId, hoặc timeslots");
            }

            // Chuyển đổi date thành đối tượng Date nếu nó là chuỗi
            if (typeof date === 'string') {
                date = new Date(date);
            }

            // Kiểm tra xem date có phải là một đối tượng Date hợp lệ không
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                throw new Error(`Ngày không hợp lệ trong booking: ${JSON.stringify(booking)}`);
            }

            // Kiểm tra courtId có thuộc trung tâm không
            if (!courtIds.includes(courtId.toString())) {
                throw new Error(`Sân ${courtId} không thuộc trung tâm ${centerId}`);
            }

            // Kiểm tra timeslots hợp lệ (phải là số nguyên từ 5 đến 23)
            for (const slot of timeslots) {
                if (!Number.isInteger(slot) || slot < 5 || slot > 23) {
                    throw new Error(`Khung giờ ${slot} không hợp lệ, phải từ 5 đến 23`);
                }
            }

            bookingDates.push(date);
        }

        // Tính khoảng thời gian để kiểm tra xung đột
        const minDate = new Date(Math.min(...bookingDates));
        const maxDate = new Date(Math.max(...bookingDates));
        console.log('createFixedBookings - Booking date range:', {
            minDate: minDate.toISOString(),
            maxDate: maxDate.toISOString()
        });

        // Lấy danh sách booking hiện có trong khoảng thời gian
        const existingBookings = await Booking.find({
            centerId,
            date: { $gte: minDate, $lte: maxDate },
            status: { $in: ["paid", "pending", "processing", "fixed"] },
        }).lean();
        console.log('createFixedBookings - Existing bookings:', existingBookings);

        // Kiểm tra xung đột
        for (const booking of bookings) {
            let { date, courtId, timeslots } = booking;

            // Chuyển đổi date thành đối tượng Date nếu nó là chuỗi
            if (typeof date === 'string') {
                date = new Date(date);
            }

            // Kiểm tra lại để đảm bảo date hợp lệ
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                throw new Error(`Ngày không hợp lệ trong booking khi kiểm tra xung đột: ${JSON.stringify(booking)}`);
            }

            const bookingDate = date;

            const conflictingBookings = existingBookings.filter((existing) => {
                const existingDate = new Date(existing.date);
                return (
                    existingDate.toDateString() === bookingDate.toDateString() &&
                    existing.courts.some((c) => c.courtId.toString() === courtId.toString()) &&
                    existing.courts.some((c) =>
                        c.timeslots.some((slot) => timeslots.includes(slot))
                    )
                );
            });

            if (conflictingBookings.length > 0) {
                console.log(`createFixedBookings - Conflict found for court ${courtId} on ${bookingDate.toISOString()}:`, conflictingBookings);
                throw new Error(`Sân ${courtId} đã được đặt vào ngày ${bookingDate.toISOString()} trong khung giờ ${timeslots.join(", ")}`);
            }
        }

        // Tạo các booking mới
        const newBookings = await Promise.all(
            bookings.map(async (booking) => {
                let { date, courtId, timeslots } = booking;

                // Chuyển đổi date thành đối tượng Date nếu nó là chuỗi
                if (typeof date === 'string') {
                    date = new Date(date);
                }

                // Kiểm tra lại để đảm bảo date hợp lệ trước khi tạo booking
                if (!(date instanceof Date) || isNaN(date.getTime())) {
                    throw new Error(`Ngày không hợp lệ trong booking khi tạo mới: ${JSON.stringify(booking)}`);
                }   

                const newBooking = new Booking({
                    userId,
                    centerId,
                    date: date,
                    courts: [
                        {
                            courtId,
                            timeslots: [...new Set(timeslots)].sort((a, b) => a - b), // Loại bỏ trùng lặp và sắp xếp
                        },
                    ],
                    status: "paid", // Trạng thái là paid
                    type: "fixed", // Loại booking cố định
                    totalAmount: 0, // Có thể thêm logic tính giá sau
                    paymentMethod: "banking", // Đặt cố định không cần thanh toán
                    bookingCode: `FIXED-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Mã booking
                    note: "Đặt cố định từ hệ thống",
                    createdAt: new Date(),
                });

                await newBooking.save();
                console.log(`createFixedBookings - Created booking for ${date.toISOString()}:`, newBooking);

                return {
                    _id: newBooking._id.toString(),
                    userId: newBooking.userId.toString(),
                    centerId: newBooking.centerId.toString(),
                    date: newBooking.date,
                    courts: newBooking.courts.map(court => ({
                        courtId: court.courtId.toString(),
                        timeslots: court.timeslots,
                    })),
                    status: newBooking.status,
                    type: newBooking.type,
                    bookingCode: newBooking.bookingCode,
                    createdAt: newBooking.createdAt,
                };
            })
        );

        console.log('createFixedBookings - All bookings created:', newBookings);
        return newBookings;
    } catch (error) {
        console.error('createFixedBookings - Error:', error.message);
        throw new Error(`Lỗi khi tạo booking cố định: ${error.message}`);
    }
};

export {
    getAllBillsWithDetails,
    updateBillStatusService,
    searchUsersService,
    getAllCentersService,
    getAvailableCourts,
    createFixedBookings,
};