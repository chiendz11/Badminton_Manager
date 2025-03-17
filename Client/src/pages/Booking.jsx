// src/pages/BookingSchedule.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "../components/datepicker";
import Legend from "../components/legend";
import BookingTable from "../components/bookingTable";
import socket from "../socket";
import { getCourtsByCenter } from "../apis/courts";
import { getBookingStatusByCourt } from "../apis/courtStatus";
import {
  getPendingMapping,
  confirmBookingToDB,
  clearAllPendingBookings
} from "../apis/booking";

const times = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const slotCount = times.length - 1;

const BookingSchedule = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = new URLSearchParams(search);

  // Lấy thông tin từ URL
  const userIdFromQuery = query.get("user") || "000000000000000000000001";
  const centerIdFromQuery = query.get("centerId") || "67ca6e3cfc964efa218ab7d7";
  const dateFromQuery = query.get("date") || new Date().toISOString().split("T")[0];

  const currentUserId = userIdFromQuery;
  const centerId = centerIdFromQuery;
  const [selectedDate, setSelectedDate] = useState(dateFromQuery);

  // Các state để lưu dữ liệu mapping
  const [courts, setCourts] = useState([]);
  const [bookedMapping, setBookedMapping] = useState({});
  const [pendingMapping, setPendingMapping] = useState({});
  const [mergedMapping, setMergedMapping] = useState({});

  // Ref để lưu giá trị ngày trước đó (nếu cần)
  const prevDateRef = useRef(selectedDate);

  // --- CLEAR TOÀN BỘ CACHE PENDING (không phân theo ngày) ---  
  // Khi trang load (F5), gọi API clearAllPendingBookings để xóa toàn bộ cache pending của user tại trung tâm.
  useEffect(() => {
    const clearAll = async () => {
      try {
        await clearAllPendingBookings({ userId: currentUserId, centerId });
        console.log("Cleared all pending bookings on load");
      } catch (error) {
        console.error("Error clearing all pending bookings on load:", error);
      }
    };
    clearAll();
  }, [currentUserId, centerId]);

  // Khi người dùng chuyển ngày qua DatePicker, cập nhật selectedDate và xóa toàn bộ cache pending.
  const handleDateChange = async (newDate) => {
    console.log("DatePicker selected date:", newDate);
    setSelectedDate(newDate);
    try {
      await clearAllPendingBookings({ userId: currentUserId, centerId });
      console.log("Cleared all pending bookings on date change");
    } catch (error) {
      console.error("Error clearing pending bookings on date change:", error);
    }
  };

  // Khi component unmount (ví dụ nhấn back), xóa toàn bộ cache pending.
  useEffect(() => {
    return () => {
      clearAllPendingBookings({ userId: currentUserId, centerId })
        .then(() => console.log("Cleared all pending bookings on unmount"))
        .catch((err) => console.error("Error clearing pending bookings on unmount:", err));
    };
  }, [currentUserId, centerId]);

  // --- FETCH DANH SÁCH SÂN ---
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const data = await getCourtsByCenter(centerId);
        console.log("Fetched courts:", data);
        setCourts(Array.isArray(data) ? data : data.data);
      } catch (error) {
        console.error("Error fetching courts:", error);
      }
    };
    fetchCourts();
  }, [centerId]);

  // --- FETCH MAPPING ---
  // Hàm reFetchMapping: lấy lại bookedMapping và pendingMapping cho ngày được chọn.
  const reFetchMapping = useCallback(async () => {
    if (courts.length > 0) {
      // Lấy booked mapping
      const booked = {};
      for (const court of courts) {
        try {
          const statusArray = await getBookingStatusByCourt(centerId, selectedDate, court._id);
          booked[court._id] = statusArray;
        } catch (error) {
          console.error("Error fetching booking status for court:", court._id, error);
          booked[court._id] = Array(slotCount).fill("trống");
        }
      }
      // Lấy pending mapping
      const pending = await getPendingMapping(centerId, selectedDate);
      console.log("Re-fetched booked mapping:", booked);
      console.log("Re-fetched pending mapping:", pending);
      setBookedMapping(booked);
      setPendingMapping(pending);
    }
  }, [centerId, courts, selectedDate]);

  // Khi selectedDate thay đổi, clear các mapping state để giao diện hiển thị trống, sau đó re-fetch dữ liệu.
  useEffect(() => {
    setBookedMapping({});
    setPendingMapping({});
    setMergedMapping({});
    prevDateRef.current = selectedDate;
    reFetchMapping();
  }, [selectedDate, reFetchMapping]);

  // Fetch booked mapping cho ngày được chọn
  useEffect(() => {
    const fetchBookedMapping = async () => {
      if (courts.length > 0) {
        const mapping = {};
        for (const court of courts) {
          try {
            const statusArray = await getBookingStatusByCourt(centerId, selectedDate, court._id);
            mapping[court._id] = statusArray;
          } catch (error) {
            console.error("Error fetching booking status for court:", court._id, error);
            mapping[court._id] = Array(slotCount).fill("trống");
          }
        }
        console.log("Booked mapping from API:", mapping);
        setBookedMapping(mapping);
      }
    };
    fetchBookedMapping();
  }, [courts, centerId, selectedDate]);

  // Fetch pending mapping cho ngày được chọn
  useEffect(() => {
    const fetchPendingMapping = async () => {
      try {
        const mapping = await getPendingMapping(centerId, selectedDate);
        console.log("Fetched pending mapping from API:", mapping);
        setPendingMapping(mapping);
      } catch (error) {
        console.error("Error fetching pending mapping:", error);
      }
    };
    fetchPendingMapping();
  }, [centerId, selectedDate]);

  // --- POLLING: reFetchMapping mỗi 10 giây ---
  useEffect(() => {
    const interval = setInterval(() => {
      reFetchMapping();
    }, 10000);
    return () => clearInterval(interval);
  }, [reFetchMapping]);

  // --- SOCKET.IO: Lắng nghe sự kiện realtime ---
  useEffect(() => {
    const handleUpdateBookings = (data) => {
      console.log("Received updateBookings event:", data);
      if (data.date === selectedDate) {
        setPendingMapping(data.mapping);
        reFetchMapping();
      }
    };

    socket.on("updateBookings", handleUpdateBookings);
    socket.on("bookingUpdated", () => {
      reFetchMapping();
    });
    return () => {
      socket.off("updateBookings", handleUpdateBookings);
      socket.off("bookingUpdated");
    };
  }, [selectedDate, reFetchMapping]);

  // --- HỢP NHẤT MAPPING ---
  useEffect(() => {
    const merged = {};
    courts.forEach((court) => {
      const courtId = court._id;
      const booked = bookedMapping[courtId] || Array(slotCount).fill("trống");
      const pending = pendingMapping[courtId] || Array(slotCount).fill("trống");
      const mergedArray = [];
      for (let i = 0; i < slotCount; i++) {
        if (booked[i] === "đã đặt") {
          mergedArray[i] = "đã đặt";
        } else if (typeof pending[i] === "object" && pending[i] !== null) {
          mergedArray[i] = pending[i].userId === currentUserId ? "myPending" : "pending";
        } else if (typeof pending[i] === "string") {
          mergedArray[i] = pending[i];
        } else {
          mergedArray[i] = "trống";
        }
      }
      merged[courtId] = mergedArray;
    });
    console.log("Merged mapping:", merged);
    setMergedMapping(merged);
  }, [bookedMapping, pendingMapping, courts, currentUserId]);

  // --- XỬ LÝ CLICK VÀO Ô ---
  // Chỉ cho phép thao tác nếu ô có trạng thái "trống" hoặc "myPending"
  const toggleBookingStatus = (rowIndex, colIndex) => {
    const courtId = courts[rowIndex]._id;
    console.log(`Toggling slot for court ${courtId} at colIndex ${colIndex} on date ${selectedDate}`);
    socket.emit("toggleBooking", { centerId, date: selectedDate, courtId, colIndex, userId: currentUserId });
  };

  // --- XÁC NHẬN BOOKING ---
  // Khi nhấn "Xác nhận", pending booking chuyển sang DB và chuyển hướng sang PaymentPage
  const handleConfirm = async () => {
    try {
      const { success, booking } = await confirmBookingToDB({
        userId: currentUserId,
        centerId,
        date: selectedDate
      });
      if (success) {
        alert(`Booking pending đã được lưu vào DB (TTL 5 phút) cho ngày ${selectedDate}.\nBooking ID: ${booking._id}`);
        navigate(`/payment?user=${currentUserId}&centerId=${centerId}&date=${selectedDate}`);
      }
    } catch (error) {
      alert("Lỗi khi xác nhận booking: " + error.message);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-green-900 text-white p-4 relative">
      <div className="text-center text-xl font-bold">Đặt lịch ngày trực quan</div>
      <div className="text-center text-md font-bold text-black bg-gray-200 p-2 my-2">
        Bạn đang đăng nhập với user: {currentUserId}
      </div>
      <div className="bg-white text-black mt-4 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <Legend />
          <DatePicker value={selectedDate} onDateChange={handleDateChange} />
        </div>
        <p className="text-red-500 mt-2">
          Lưu ý: Nếu bạn cần đặt lịch cố định, vui lòng liên hệ: 0918.773.883 để được hỗ trợ.
        </p>
      </div>
      {courts.length > 0 ? (
        <BookingTable 
          courts={courts}
          bookingData={mergedMapping}
          toggleBookingStatus={toggleBookingStatus}
          times={times}
          slotCount={slotCount}
          currentUserId={currentUserId}
        />
      ) : (
        <div>Đang tải dữ liệu...</div>
      )}
      <div className="text-center mt-4">
        <button
          onClick={handleConfirm}
          className="bg-blue-500 text-white font-bold px-6 py-2 rounded hover:bg-blue-600"
        >
          Xác nhận
        </button>
      </div>
    </div>
  );
};

export default BookingSchedule;
