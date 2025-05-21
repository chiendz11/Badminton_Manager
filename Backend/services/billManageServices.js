import Booking from '../models/bookings.js';
import Court from '../models/courts.js';
import User from '../models/users.js';
import Center from '../models/centers.js';
import { updateUserPoints } from './userServices.js'; // Giả sử bạn có một service để cập nhật điểm cho người dùng  

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

        // Tách daily và fixed bookings
        const dailyBookings = bookings.filter(booking => booking.type === "daily");
        const fixedBookings = bookings.filter(booking => booking.type === "fixed");

        let bills = [];

        // Xử lý daily bookings (giữ nguyên logic)
        const dailyBills = await Promise.all(
            dailyBookings.map(async (booking) => {
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
                        return `${courtName}: ${timeslotRange}`;
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

        bills.push(...dailyBills);

        // Gộp fixed bookings dựa trên userId, centerId và bookingCode
        const fixedGroups = {};

        for (const booking of fixedBookings) {
            // Lấy phần đầu của bookingCode (ví dụ: FIXED-174522221)
            const bookingCodePrefix = booking.bookingCode.split("-").slice(0, 2).join("-");

            // Tạo key để gộp dựa trên userId, centerId và bookingCode
            const groupKey = `${booking.userId}-${booking.centerId}-${bookingCodePrefix}`;

            if (!fixedGroups[groupKey]) {
                fixedGroups[groupKey] = {
                    bookingIds: [],
                    dates: [],
                    userName: booking.userId.name,
                    centerId: booking.centerId,
                    centerName: booking.centerId.name,
                    courts: [], // Danh sách sân sẽ được gộp
                    status: booking.status,
                    totalAmount: 0,
                    paymentMethod: booking.paymentMethod,
                    bookingCode: bookingCodePrefix,
                    type: booking.type,
                    note: booking.note,
                    paymentImage: null,
                    createdAt: booking.createdAt,
                };
            }

            // Thêm bookingId và date vào group
            fixedGroups[groupKey].bookingIds.push(booking._id.toString());
            fixedGroups[groupKey].dates.push(new Date(booking.date));

            // Gộp courts vào danh sách
            booking.courts.forEach(court => {
                const existingCourt = fixedGroups[groupKey].courts.find(c => c.courtId.toString() === court.courtId.toString());
                if (existingCourt) {
                    // Nếu sân đã tồn tại, gộp timeslots và loại bỏ trùng lặp
                    existingCourt.timeslots = [...new Set([...existingCourt.timeslots, ...court.timeslots])].sort((a, b) => a - b);
                } else {
                    fixedGroups[groupKey].courts.push({
                        courtId: court.courtId,
                        timeslots: [...new Set(court.timeslots)].sort((a, b) => a - b),
                    });
                }
            });

            // Cộng dồn totalAmount
            fixedGroups[groupKey].totalAmount += booking.totalAmount || 0;

            // Cập nhật paymentImage nếu có
            if (booking.paymentImage && booking.imageType && !fixedGroups[groupKey].paymentImage) {
                try {
                    const base64Image = Buffer.isBuffer(booking.paymentImage)
                        ? booking.paymentImage.toString("base64")
                        : booking.paymentImage.toString("base64");
                    const validMimeTypes = ["image/jpeg", "image/png", "image/gif"];
                    const mimeType = validMimeTypes.includes(booking.imageType)
                        ? booking.imageType
                        : "image/jpeg";
                    fixedGroups[groupKey].paymentImage = `data:${mimeType};base64,${base64Image}`;
                } catch (error) {
                    console.error(`Lỗi khi xử lý paymentImage cho booking ${booking._id}:`, error);
                }
            }
        }

        // Chuyển các fixed groups thành bill entries
        for (const groupKey in fixedGroups) {
            const group = fixedGroups[groupKey];

            // Gộp thông tin sân và khung giờ
            const courtTimeArray = await Promise.all(
                group.courts.map(async (court) => {
                    const courtDoc = await Court.findById(court.courtId).select("name");
                    const courtName = courtDoc ? courtDoc.name : court.courtId;
                    const timeslotRange = formatTimeslots(court.timeslots);
                    return `${courtName}: ${timeslotRange}`;
                })
            );
            const courtTime = courtTimeArray.join("; ");

            // Tìm startDate và endDate
            const dates = group.dates.sort((a, b) => a - b);
            const startDate = dates[0];
            const endDate = dates[dates.length - 1];

            bills.push({
                _id: group.bookingIds, // Mảng các bookingId
                userName: group.userName,
                centerName: group.centerName,
                courtTime: courtTime,
                date: startDate,
                startDate: startDate,
                endDate: endDate,
                status: group.status,
                totalAmount: group.totalAmount,
                paymentMethod: group.paymentMethod,
                bookingCode: group.bookingCode,
                type: group.type,
                note: group.note,
                paymentImage: group.paymentImage,
                createdAt: group.createdAt,
            });
        }

        // Sắp xếp bills theo createdAt (mới nhất trước)
        bills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

        // Nếu trạng thái là "paid", cập nhật điểm cho người dùng
        if (status === "paid") {
            const pointsUpdateResult = await updateUserPoints(bill.userId, bill.totalAmount);
            bill.pointEarned = pointsUpdateResult.pointsEarned;
            console.log(`User ${bill.userId} được cộng ${pointsUpdateResult.pointsEarned} điểm từ booking ${billId}`);
        }

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
                return `${courtName}: ${timeslotRange}`;
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
            pointEarned: updatedBill.pointEarned, // Thêm pointEarned vào kết quả trả về
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
const getAvailableCourts = async ({ centerId, startDate, timeslots, daysOfWeek }) => {
    try {
        // Chuẩn hóa startDate về 00:00:00 UTC
        const normalizedStartDate = new Date(startDate);
        normalizedStartDate.setUTCHours(0, 0, 0, 0);

        console.log('getAvailableCourts - Input:', {
            centerId,
            startDate: normalizedStartDate.toISOString(),
            timeslots,
            daysOfWeek
        });

        if (!centerId || !startDate || !timeslots || !daysOfWeek || timeslots.length === 0 || daysOfWeek.length === 0) {
            throw new Error("Thiếu tham số bắt buộc: centerId, startDate, timeslots, hoặc daysOfWeek");
        }

        // Tính ngày kết thúc (30 ngày sau ngày bắt đầu)
        const endDate = new Date(normalizedStartDate);
        endDate.setDate(endDate.getDate() + 30);
        console.log('getAvailableCourts - Time range:', {
            startDate: normalizedStartDate.toISOString(),
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
            date: { $gte: normalizedStartDate, $lte: endDate },
            status: { $in: ["paid", "pending", "processing"] },
            deleted: false // Chỉ lấy booking chưa bị xóa
        }).lean();
        console.log('getAvailableCourts - Bookings found:', bookings);

        // Chuẩn hóa ngày trong bookings để so sánh
        const normalizedBookings = bookings.map(booking => {
            const normalizedDate = new Date(booking.date);
            normalizedDate.setUTCHours(0, 0, 0, 0); // Chuẩn hóa về 00:00:00 UTC
            return { ...booking, date: normalizedDate };
        });

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
                let currentDate = new Date(normalizedStartDate);
                currentDate.setUTCHours(0, 0, 0, 0); // Chuẩn hóa startDate
                while (currentDate <= endDate) {
                    if (currentDate.getUTCDay() === dayOfWeek) {
                        relevantDays.push(new Date(currentDate));
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                console.log(`getAvailableCourts - Relevant days for dayOfWeek ${dayOfWeek}:`, relevantDays.map(d => d.toISOString()));

                // Chuẩn hóa timeslots thành mảng các slot (ví dụ: "13:00" -> [13])
                const requestedSlots = timeslots.map(slot => {
                    const [hour] = slot.split(":");
                    return parseInt(hour);
                });

                // Kiểm tra từng ngày
                for (const day of relevantDays) {
                    const conflictingBookings = normalizedBookings.filter((booking) => {
                        const bookingDate = new Date(booking.date);
                        return (
                            bookingDate.toISOString() === day.toISOString() && // So sánh ngày chính xác
                            booking.courts.some((c) => c.courtId.toString() === court._id.toString()) &&
                            booking.courts.some((c) =>
                                c.timeslots.some((slot) => requestedSlots.includes(slot)) // Kiểm tra trùng timeslot
                            )
                        );
                    });

                    if (conflictingBookings.length > 0) {
                        console.log(`getAvailableCourts - Conflicting bookings found for court ${court.name} on ${day.toISOString()}:`, conflictingBookings);
                        isAvailable = false;
                        break;
                    }
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

        const center = await Center.findById(centerId).select("pricing").lean();
        if (!center) {
            throw new Error("Không tìm thấy trung tâm");
        }
        console.log('createFixedBookings - Center found:', center);
        console.log('createFixedBookings - Center pricing:', center.pricing);

        // Kiểm tra pricing có dữ liệu không
        if (!center.pricing || (!center.pricing.weekday.length && !center.pricing.weekend.length)) {
            throw new Error('Dữ liệu pricing của trung tâm không hợp lệ hoặc rỗng');
        }

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

        // Hàm phụ để tìm giá áp dụng cho một timeslot
        const getPriceForTimeslot = (timeslot, pricingRules) => {
            // Chuyển timeslot thành số giờ (integer) để so sánh
            const timeslotHour = parseInt(timeslot);
            console.log(`getPriceForTimeslot - Checking timeslot ${timeslotHour} against pricing rules:`, pricingRules);

            for (const rule of pricingRules) {
                // Chuyển startTime và endTime thành số giờ để so sánh
                const startHour = parseInt(rule.startTime.split(":")[0]);
                const endHour = parseInt(rule.endTime.split(":")[0]);
                console.log(`getPriceForTimeslot - Comparing ${timeslotHour} with rule: startHour=${startHour}, endHour=${endHour}`);

                if (timeslotHour >= startHour && timeslotHour < endHour) {
                    console.log(`getPriceForTimeslot - Match found: Price = ${rule.price}`);
                    return rule.price;
                }
            }

            throw new Error(`Không tìm thấy giá phù hợp cho khung giờ ${timeslotHour}:00 trong pricing rules`);
        };

        // Tạo bookingCode duy nhất cho toàn bộ phiên đặt
        const bookingCodePrefix = `FIXED-${Date.now()}`;
        console.log(`createFixedBookings - Generated bookingCodePrefix: ${bookingCodePrefix}`);

        // Tạo các booking mới
        const newBookings = await Promise.all(
            bookings.map(async (booking, index) => {
                let { date, courtId, timeslots } = booking;

                // Chuyển đổi date thành đối tượng Date nếu nó là chuỗi
                if (typeof date === 'string') {
                    date = new Date(date);
                }

                // Kiểm tra lại để đảm bảo date hợp lệ trước khi tạo booking
                if (!(date instanceof Date) || isNaN(date.getTime())) {
                    throw new Error(`Ngày không hợp lệ trong booking khi tạo mới: ${JSON.stringify(booking)}`);
                }

                // Tính giá cho booking
                const bookingDate = new Date(date);
                const dayOfWeek = bookingDate.getUTCDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Chủ nhật (0) hoặc Thứ 7 (6)
                const pricingRules = isWeekend ? center.pricing.weekend : center.pricing.weekday;
                console.log(`createFixedBookings - Calculating price for booking on ${bookingDate.toISOString()}:`, {
                    dayOfWeek,
                    isWeekend,
                    pricingRules,
                    timeslots
                });

                let totalPrice = 0;
                for (const timeslot of timeslots) {
                    const pricePerHour = getPriceForTimeslot(timeslot, pricingRules);
                    totalPrice += pricePerHour;
                    console.log(`createFixedBookings - Price for timeslot ${timeslot}: ${pricePerHour}, Running total: ${totalPrice}`);
                }

                if (totalPrice === 0) {
                    throw new Error(`Tổng giá cho booking trên ${bookingDate.toISOString()} là 0. Kiểm tra pricing rules và timeslots.`);
                }

                // Tạo bookingCode duy nhất cho mỗi booking lẻ, nhưng giữ phần prefix giống nhau
                const bookingCode = `${bookingCodePrefix}-${index + 1}`; // Ví dụ: FIXED-174522221-1, FIXED-174522221-2

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
                    totalAmount: totalPrice, // Tổng giá đã tính
                    paymentMethod: "banking", // Đặt cố định không cần thanh toán
                    bookingCode: bookingCode, // Sử dụng bookingCode thống nhất
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
                    totalAmount: newBooking.totalAmount,
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