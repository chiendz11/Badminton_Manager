import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchUsers, getAllCenters } from "../apis/billManaging";
import toast from "react-hot-toast";
import { ArrowLeftIcon, CalendarIcon, UserIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axiosInstance from "../config/axiosConfig";

const CreateFixedBooking = () => {
    const navigate = useNavigate();
    const [centers, setCenters] = useState([]);
    const [courts, setCourts] = useState([]);
    const [selectedCenter, setSelectedCenter] = useState("");
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedTimeslots, setSelectedTimeslots] = useState([]);
    const [timeslotsByDay, setTimeslotsByDay] = useState({});
    const [selectedCourtsByDay, setSelectedCourtsByDay] = useState({});
    const [startDate, setStartDate] = useState(new Date(2025, 3, 17));
    const [courtAvailability, setCourtAvailability] = useState({});
    const [loadingCenters, setLoadingCenters] = useState(false);
    const [loading, setLoading] = useState(false);

    // Tìm kiếm người dùng
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Tính ngày kết thúc (30 ngày sau ngày bắt đầu)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 30);

    // Danh sách khung giờ (từ 5:00 đến 23:00, mỗi khung giờ 1 tiếng)
    const availableTimeslots = Array.from({ length: 19 }, (_, i) => `${i + 5}:00`);

    // Danh sách ngày trong tuần
    const daysOfWeek = [
        { value: 1, label: "Thứ 2" },
        { value: 2, label: "Thứ 3" },
        { value: 3, label: "Thứ 4" },
        { value: 4, label: "Thứ 5" },
        { value: 5, label: "Thứ 6" },
        { value: 6, label: "Thứ 7" },
        { value: 0, label: "Chủ nhật" },
    ];

    // Xử lý nút quay lại của trình duyệt
    useEffect(() => {
        const handlePopState = () => {
            navigate("/admin/bill-list", { replace: true });
        };

        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [navigate]);

    // Lấy danh sách trung tâm
    useEffect(() => {
        const fetchCenters = async () => {
            setLoadingCenters(true);
            try {
                const centersData = await getAllCenters();
                if (centersData.length === 0) {
                    toast.error("Không có trung tâm nào để hiển thị!");
                }
                setCenters(centersData);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách trung tâm:", error);
                toast.error("Không thể lấy danh sách trung tâm!");
                setCenters([]);
            } finally {
                setLoadingCenters(false);
            }
        };
        fetchCenters();
    }, []);

    // Tìm kiếm người dùng khi nhập query (trên username, phone_number, email)
    useEffect(() => {
        if (selectedUser || !searchQuery) {
            setUsers([]);
            setShowDropdown(false);
            return;
        }

        const fetchUsers = async () => {
            try {
                const usersData = await searchUsers(searchQuery);
                setUsers(usersData);
                setShowDropdown(usersData.length > 0);
            } catch (error) {
                console.error("Lỗi khi tìm kiếm người dùng:", error);
                toast.error("Không thể tìm kiếm người dùng!");
                setUsers([]);
                setShowDropdown(false);
            }
        };
        fetchUsers();
    }, [searchQuery, selectedUser]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Lấy danh sách sân theo trung tâm
    useEffect(() => {
        if (!selectedCenter) {
            setCourts([]);
            setSelectedCourtsByDay({});
            return;
        }

        const fetchCourts = async () => {
            try {
                const response = await axiosInstance.get(`/api/courts?centerId=${selectedCenter}`);
                setCourts(response.data.data || []);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách sân:", error);
                toast.error("Không thể lấy danh sách sân!");
            }
        };
        fetchCourts();
    }, [selectedCenter]);

    // Cập nhật timeslotsByDay khi selectedDays hoặc selectedTimeslots thay đổi
    useEffect(() => {
        const newTimeslotsByDay = {};
        selectedDays.forEach((day) => {
            newTimeslotsByDay[day] = selectedTimeslots;
        });
        setTimeslotsByDay(newTimeslotsByDay);
    }, [selectedDays, selectedTimeslots]);

    // Tính toán các ngày phù hợp và kiểm tra trạng thái sân
    useEffect(() => {
        if (!selectedCenter || courts.length === 0 || selectedDays.length === 0 || selectedTimeslots.length === 0) {
            setCourtAvailability({});
            return;
        }

        const fetchBillsAndCheckStatus = async () => {
            try {
                const response = await axiosInstance.get("/api/bills/range", {
                    params: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        centerId: selectedCenter,
                    },
                });
                const bills = response.data.data || [];

                const availability = {};
                selectedDays.forEach((dayOfWeek) => {
                    availability[dayOfWeek] = {};
                    courts.forEach((court) => {
                        availability[dayOfWeek][court._id] = {};
                        selectedTimeslots.forEach((timeslot) => {
                            const [hour] = timeslot.split(":");
                            const startHour = parseInt(hour);
                            const endHour = startHour + 1;

                            const relevantDays = [];
                            let currentDate = new Date(startDate);
                            const today = new Date(2025, 3, 16);
                            while (currentDate <= endDate) {
                                if (currentDate.getDay() === dayOfWeek) {
                                    if (currentDate >= today) {
                                        relevantDays.push(new Date(currentDate));
                                    }
                                }
                                currentDate.setDate(currentDate.getDate() + 1);
                            }

                            let isBooked = false;
                            let isPending = false;
                            const conflicts = [];
                            relevantDays.forEach((day) => {
                                const dayBills = bills.filter((bill) => {
                                    const billDate = new Date(bill.date);
                                    return (
                                        billDate.toDateString() === day.toDateString() &&
                                        bill.courtId === court._id &&
                                        bill.timeslots.some((slot) => slot >= startHour && slot < endHour)
                                    );
                                });

                                if (dayBills.some((bill) => bill.status === "paid")) {
                                    isBooked = true;
                                    conflicts.push(day.toLocaleDateString("vi-VN"));
                                } else if (dayBills.some((bill) => bill.status === "pending" || bill.status === "processing")) {
                                    isPending = true;
                                    conflicts.push(day.toLocaleDateString("vi-VN"));
                                }
                            });

                            if (isBooked) {
                                availability[dayOfWeek][court._id][timeslot] = { status: "booked", conflicts };
                            } else if (isPending) {
                                availability[dayOfWeek][court._id][timeslot] = { status: "pending", conflicts };
                            } else {
                                availability[dayOfWeek][court._id][timeslot] = { status: "available", conflicts: [] };
                            }
                        });
                    });
                });
                setCourtAvailability(availability);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách bill:", error);
                toast.error("Không thể lấy trạng thái sân!");
            }
        };
        fetchBillsAndCheckStatus();
    }, [selectedCenter, courts, selectedDays, selectedTimeslots, startDate]);

    // Xử lý chọn người dùng từ dropdown
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setSearchQuery(user.username);
        setShowDropdown(false);
        setUsers([]);
    };

    // Xử lý chọn timeslot
    const handleTimeslotChange = (timeslot) => {
        if (selectedTimeslots.includes(timeslot)) {
            setSelectedTimeslots(selectedTimeslots.filter(t => t !== timeslot));
        } else {
            setSelectedTimeslots([...selectedTimeslots, timeslot].sort());
        }
    };

    // Xử lý chọn ngày trong tuần
    const handleDayChange = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
            setSelectedCourtsByDay((prev) => {
                const newCourts = { ...prev };
                delete newCourts[day];
                return newCourts;
            });
        } else {
            setSelectedDays([...selectedDays, day].sort());
            setSelectedCourtsByDay((prev) => ({
                ...prev,
                [day]: [],
            }));
        }
    };

    // Xử lý chọn sân cho từng ngày trong tuần
    const handleCourtChange = (day, courtId) => {
        setSelectedCourtsByDay((prev) => {
            const currentCourts = prev[day] || [];
            if (currentCourts.includes(courtId)) {
                return {
                    ...prev,
                    [day]: currentCourts.filter(c => c !== courtId),
                };
            } else {
                return {
                    ...prev,
                    [day]: [...currentCourts, courtId],
                };
            }
        });
    };

    // Tạo lịch đặt cố định
    const handleCreateFixedBooking = async () => {
        if (
            !selectedUser ||
            !selectedCenter ||
            selectedDays.length === 0 ||
            selectedTimeslots.length === 0 ||
            Object.values(selectedCourtsByDay).some(courts => courts.length === 0)
        ) {
            toast.error("Vui lòng chọn người dùng, khung giờ, ngày và sân!");
            return;
        }

        let hasConflict = false;
        const conflictDetails = [];
        selectedDays.forEach((dayOfWeek) => {
            const timeslots = timeslotsByDay[dayOfWeek] || [];
            const selectedCourts = selectedCourtsByDay[dayOfWeek] || [];
            timeslots.forEach((timeslot) => {
                selectedCourts.forEach((courtId) => {
                    const status = courtAvailability[dayOfWeek]?.[courtId]?.[timeslot]?.status;
                    if (status === "booked" || status === "pending") {
                        hasConflict = true;
                        const conflicts = courtAvailability[dayOfWeek][courtId][timeslot].conflicts;
                        conflictDetails.push(
                            `Sân ${courts.find(c => c._id === courtId).name} tại khung giờ ${timeslot} vào ${daysOfWeek.find(d => d.value === dayOfWeek).label} đã ${
                                status === "booked" ? "được đặt" : "đang chờ duyệt"
                            } vào các ngày: ${conflicts.join(", ")}`
                        );
                    }
                });
            });
        });

        if (hasConflict) {
            toast.error(`Không thể đặt lịch do xung đột:\n${conflictDetails.join("\n")}`);
            return;
        }

        setLoading(true);
        try {
            const bookings = [];
            let currentDate = new Date(startDate);
            const today = new Date(2025, 3, 16);
            while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay();
                if (selectedDays.includes(dayOfWeek) && currentDate >= today) {
                    const timeslots = timeslotsByDay[dayOfWeek] || [];
                    const selectedCourts = selectedCourtsByDay[dayOfWeek] || [];
                    selectedCourts.forEach((courtId) => {
                        bookings.push({
                            date: new Date(currentDate),
                            courtId,
                            timeslots: timeslots.map((slot) => {
                                const [hour] = slot.split(":");
                                return parseInt(hour);
                            }),
                        });
                    });
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const response = await axiosInstance.post("/api/bookings/fixed", {
                userId: selectedUser._id,
                centerId: selectedCenter,
                bookings,
                type: "fixed",
            });

            if (response.data.success) {
                toast.success("Tạo lịch đặt cố định thành công!");
                navigate("/admin/bill-list");
            } else {
                throw new Error(response.data.message || "Lỗi khi tạo lịch đặt cố định");
            }
        } catch (error) {
            console.error("Lỗi khi tạo lịch đặt cố định:", error);
            toast.error(error.message || "Lỗi khi tạo lịch đặt cố định!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen w-full font-inter">
            <div className="bg-emerald-700 text-white flex items-center p-3">
                <button onClick={() => navigate("/admin/bill-list")} className="mr-2">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-semibold flex-1 text-center">
                    Đặt lịch cố định
                </h1>
            </div>

            <div className="max-w-3xl mx-auto p-4">
                {/* Tìm kiếm người dùng */}
                <div className="mb-4 relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tìm kiếm khách hàng:
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nhập tên người dùng, số điện thoại hoặc email"
                            className="border border-gray-300 rounded-md p-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                        />
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-500" />
                    </div>
                    {showDropdown && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                            {users.map((user) => (
                                <div
                                    key={user._id}
                                    onClick={() => handleSelectUser(user)}
                                    className="p-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                                >
                                    <span className="text-sm font-medium">{user.username}</span>
                                    <span className="text-sm text-gray-500">({user.email}, {user.phoneNumber})</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hiển thị thông tin người dùng */}
                {selectedUser && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-md">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin khách hàng:</h3>
                        <p className="text-sm text-gray-600">
                            <strong>Tên người dùng:</strong> {selectedUser.username}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Số điện thoại:</strong> {selectedUser.phoneNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                            <strong>Email:</strong> {selectedUser.email}
                        </p>
                    </div>
                )}

                {/* Chọn trung tâm */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Trung tâm:
                    </label>
                    <select
                        value={selectedCenter}
                        onChange={(e) => setSelectedCenter(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                        disabled={loadingCenters}
                    >
                        <option value="">Chọn trung tâm</option>
                        {centers.map((center) => (
                            <option key={center._id} value={center._id}>
                                {center.name}
                            </option>
                        ))}
                    </select>
                    {loadingCenters && (
                        <p className="text-sm text-gray-500 mt-1">Đang tải danh sách trung tâm...</p>
                    )}
                </div>

                {/* Chọn ngày bắt đầu */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày bắt đầu:
                    </label>
                    <div className="relative flex-1">
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Chọn ngày bắt đầu"
                            className="border border-gray-300 rounded-md p-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                            onKeyDown={(e) => e.preventDefault()}
                        />
                        <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Áp dụng từ {startDate.toLocaleDateString("vi-VN")} đến {endDate.toLocaleDateString("vi-VN")}
                    </p>
                </div>

                {/* Chọn thời gian và ngày trong tuần */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn thời gian:
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {availableTimeslots.map((timeslot) => (
                            <div
                                key={timeslot}
                                onClick={() => handleTimeslotChange(timeslot)}
                                className={`flex-1 min-w-[60px] text-center p-2 rounded-md cursor-pointer border ${
                                    selectedTimeslots.includes(timeslot)
                                        ? "bg-emerald-500 text-white border-emerald-500"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                            >
                                {timeslot}
                            </div>
                        ))}
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chọn ngày trong tuần:
                    </label>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {daysOfWeek.map((day) => (
                            <div
                                key={day.value}
                                onClick={() => handleDayChange(day.value)}
                                className={`flex-1 min-w-[80px] text-center p-2 rounded-md cursor-pointer border ${
                                    selectedDays.includes(day.value)
                                        ? "bg-emerald-500 text-white border-emerald-500"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                            >
                                {day.label}
                        </div>
                        ))}
                    </div>

                    {/* Hiển thị sân trống cho các ngày và khung giờ đã chọn */}
                    {selectedDays.length > 0 && selectedTimeslots.length > 0 && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sân trống:
                            </label>
                            {daysOfWeek
                                .filter((day) => selectedDays.includes(day.value))
                                .map((day) => (
                                    <div key={day.value} className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">{day.label}</h4>
                                        <div className="space-y-2">
                                            {courts.map((court) => {
                                                const timeslots = timeslotsByDay[day.value] || [];
                                                const hasConflict = timeslots.some((timeslot) => {
                                                    const status = courtAvailability[day.value]?.[court._id]?.[timeslot]?.status;
                                                    return status === "booked" || status === "pending";
                                                });
                                                const conflicts = timeslots
                                                    .map((timeslot) => courtAvailability[day.value]?.[court._id]?.[timeslot]?.conflicts || [])
                                                    .flat();

                                                return (
                                                    <label key={court._id} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={(selectedCourtsByDay[day.value] || []).includes(court._id)}
                                                            onChange={() => handleCourtChange(day.value, court._id)}
                                                            disabled={hasConflict}
                                                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                                                        />
                                                        <span
                                                            className={`text-sm ${
                                                                !hasConflict
                                                                    ? "text-green-600"
                                                                    : hasConflict && conflicts.length > 0
                                                                    ? "text-red-600"
                                                                    : "text-yellow-600"
                                                            }`}
                                                        >
                                                            {court.name}{" "}
                                                            {hasConflict && conflicts.length > 0 ? `(Xung đột: ${conflicts.join(", ")})` : ""}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Nút xác nhận */}
                <button
                    onClick={handleCreateFixedBooking}
                    disabled={loading}
                    className={`w-full bg-yellow-500 text-white py-3 rounded-md font-semibold ${
                        loading ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-600"
                    }`}
                >
                    {loading ? "Đang xử lý..." : "Đặt trước"}
                </button>
            </div>
        </div>
    );
};

export default CreateFixedBooking;