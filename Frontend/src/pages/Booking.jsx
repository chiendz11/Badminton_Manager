// src/pages/BookingSchedule.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "../components/datepicker";
import Legend from "../components/legend";
import BookingTable from "../components/bookingTable";
import PricingTable from "../components/PricingTable";
import socket from "../socket";
import { getCourtsByCenter, getCourtStatusByBooking, getPriceForTimeslot } from "../apis/courts";
import { getPendingMapping, confirmBookingToDB, clearAllPendingBookings } from "../apis/booking";
import ModalConfirmation from "../components/ModalConfirmation";

const times = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const slotCount = times.length - 1;

function formatSlot(slot) {
  const hour = Math.floor(slot);
  const minute = (slot - hour) * 60;
  return `${hour}h${minute === 0 ? "00" : minute}`;
}

function calculateTotal(selectedSlots) {
  const totalAmount = selectedSlots.reduce((sum, s) => sum + s.price, 0);
  const totalHours = selectedSlots.length;
  return { totalHours, totalAmount };
}

const BookingSchedule = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = new URLSearchParams(search);

  const userId = query.get("user") || "000000000000000000000001";
  const centerId = query.get("centerId") || "67ca6e3cfc964efa218ab7d7";
  const initialDate = query.get("date") || new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [courts, setCourts] = useState([]);
  const [bookedMapping, setBookedMapping] = useState({});
  const [pendingMapping, setPendingMapping] = useState({});
  const [mergedMapping, setMergedMapping] = useState({});

  // selectedSlots: mảng các object { courtId, slotVal, price }
  const [selectedSlots, setSelectedSlots] = useState([]);
  const { totalHours, totalAmount } = calculateTotal(selectedSlots);

  // State cho modal hiển thị modal xác nhận và modal bảng giá
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [continueAnimating, setContinueAnimating] = useState(false);
  const [toggleAnimating, setToggleAnimating] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Lấy danh sách sân
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const data = await getCourtsByCenter(centerId);
        setCourts(Array.isArray(data) ? data : data.data);
      } catch (error) {
        console.error("Error fetching courts:", error);
      }
    };
    fetchCourts();
  }, [centerId]);

  // Clear pending khi load (F5) – chỉ xóa cache phía server
  useEffect(() => {
    clearAllPendingBookings({ userId, centerId })
      .then(() => console.log("Cleared all pending bookings on load"))
      .catch(err => console.error("Error clearing pending on load:", err));
  }, [userId, centerId]);

  // Khi đổi ngày: cập nhật selectedDate, reset selectedSlots, clear pending
  const handleDateChange = async (newDate) => {
    setSelectedDate(newDate);
    setSelectedSlots([]);
    try {
      await clearAllPendingBookings({ userId, centerId });
      console.log("Cleared all pending bookings on date change");
    } catch (error) {
      console.error("Error clearing pending on date change:", error);
    }
  };

  // Khi component unmount: clear pending (server cache)
  useEffect(() => {
    return () => {
      clearAllPendingBookings({ userId, centerId })
        .then(() => console.log("Cleared all pending bookings on unmount"))
        .catch(err => console.error("Error clearing pending on unmount:", err));
    };
  }, [userId, centerId]);

  // reFetchMapping: lấy booked & pending mapping
  const reFetchMapping = useCallback(async () => {
    if (courts.length > 0) {
      const booked = {};
      for (const court of courts) {
        try {
          const statusArray = await getCourtStatusByBooking(centerId, selectedDate, court._id);
          booked[court._id] = statusArray;
        } catch (error) {
          booked[court._id] = Array(slotCount).fill("trống");
        }
      }
      const pending = await getPendingMapping(centerId, selectedDate);
      setBookedMapping(booked);
      setPendingMapping(pending);
    }
  }, [centerId, courts, selectedDate]);

  useEffect(() => {
    setBookedMapping({});
    setPendingMapping({});
    setMergedMapping({});
    reFetchMapping();
  }, [selectedDate, reFetchMapping]);

  useEffect(() => {
    const fetchBooked = async () => {
      if (courts.length > 0) {
        const mapping = {};
        for (const court of courts) {
          try {
            const statusArray = await getCourtStatusByBooking(centerId, selectedDate, court._id);
            mapping[court._id] = statusArray;
          } catch (error) {
            mapping[court._id] = Array(slotCount).fill("trống");
          }
        }
        setBookedMapping(mapping);
      }
    };
    fetchBooked();
  }, [courts, centerId, selectedDate]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const mapping = await getPendingMapping(centerId, selectedDate);
        setPendingMapping(mapping);
      } catch (error) {
        console.error("Error fetching pending mapping:", error);
      }
    };
    fetchPending();
  }, [centerId, selectedDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      reFetchMapping();
    }, 10000);
    return () => clearInterval(interval);
  }, [reFetchMapping]);

  useEffect(() => {
    const handleUpdateBookings = (data) => {
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

  useEffect(() => {
    const merged = {};
    courts.forEach(court => {
      const courtId = court._id;
      const bookedArr = bookedMapping[courtId] || Array(slotCount).fill("trống");
      const pendingArr = pendingMapping[courtId] || Array(slotCount).fill("trống");
      const mergedArray = [];
      for (let i = 0; i < slotCount; i++) {
        if (bookedArr[i] === "đã đặt") {
          mergedArray[i] = "đã đặt";
        } else if (typeof pendingArr[i] === "object" && pendingArr[i] !== null) {
          mergedArray[i] = pendingArr[i].userId === userId ? "myPending" : "pending";
        } else if (typeof pendingArr[i] === "string") {
          mergedArray[i] = pendingArr[i];
        } else {
          mergedArray[i] = "trống";
        }
      }
      merged[courtId] = mergedArray;
    });
    setMergedMapping(merged);
  }, [bookedMapping, pendingMapping, courts, userId]);

  // Nếu không còn ô "myPending", reset selectedSlots và ẩn modal xác nhận
  useEffect(() => {
    let hasMyPending = false;
    Object.values(mergedMapping).forEach(slotArr => {
      if (slotArr.includes("myPending")) {
        hasMyPending = true;
      }
    });
    if (!hasMyPending) {
      console.log("No pending timeslots remain for user. Clearing selectedSlots and closing modal.");
      setSelectedSlots([]);
      setShowModal(false);
      setContinueAnimating(false);
    }
  }, [mergedMapping]);

  // Khi user click vào ô timeslot: gọi API getPriceForTimeslot và cập nhật selectedSlots
  const toggleBookingStatus = async (rowIndex, colIndex) => {
    const courtId = courts[rowIndex]._id;
    const slotVal = times[colIndex];
    socket.emit("toggleBooking", { centerId, date: selectedDate, courtId, colIndex, userId });

    setSelectedSlots(prev => {
      const foundIndex = prev.findIndex(s => s.courtId === courtId && s.slotVal === slotVal);
      if (foundIndex > -1) {
        return prev.filter((_, idx) => idx !== foundIndex);
      } else {
        return [...prev, { courtId, slotVal, price: 0 }];
      }
    });

    try {
      const response = await getPriceForTimeslot({ centerId, date: selectedDate, timeslot: slotVal });
      if (response.success) {
        setSelectedSlots(prev =>
          prev.map(s =>
            s.courtId === courtId && s.slotVal === slotVal ? { ...s, price: response.price } : s
          )
        );
      }
    } catch (error) {
      console.error("Error getting price for timeslot:", error);
    }
  };

  const groupSelectedSlots = () => {
    const map = {};
    selectedSlots.forEach(({ courtId, slotVal }) => {
      if (!map[courtId]) map[courtId] = [];
      map[courtId].push(slotVal);
    });
    const result = [];
    Object.keys(map).forEach(cId => {
      const arr = map[cId];
      const minSlot = Math.min(...arr);
      const maxSlot = Math.max(...arr);
      const courtObj = courts.find(c => c._id === cId);
      const courtName = courtObj ? courtObj.name : `Court ${cId}`;
      result.push({
        courtName,
        startStr: formatSlot(minSlot),
        endStr: formatSlot(maxSlot + 1)
      });
    });
    return result;
  };

  // Xác nhận booking: hiển thị modal xác nhận với hiệu ứng
  const handleConfirm = async () => {
    setContinueAnimating(true);
    setShowModal(true);
  };

  const handleModalAction = async (action) => {
    if (action === "pay") {
      try {
        const { success, booking } = await confirmBookingToDB({
          userId,
          centerId,
          date: selectedDate
        });
        if (success) {
          console.log("Booking pending saved to DB:", booking);
          localStorage.setItem("bookingExpiresAt", booking.expiresAt);
          console.log("Stored bookingExpiresAt in localStorage:", localStorage.getItem("bookingExpiresAt"));
          alert(`Booking pending đã được lưu vào DB.\nBooking ID: ${booking._id}`);
          navigate(`/payment?user=${userId}&centerId=${centerId}&date=${selectedDate}&total=${totalAmount}`);
        }
      } catch (error) {
        console.error("Error confirming booking:", error);
        alert("Lỗi khi xác nhận booking: " + error.message);
      }
    } else if (action === "edit") {
      setShowModal(false);
      setContinueAnimating(false);
    }
  };

  const formatMoney = (val) => val.toLocaleString("vi-VN") + " đ";

  return (
    <div className="min-h-screen w-screen bg-green-900 text-white p-4 relative">
      {/* Tiêu đề */}
      <div className="text-center text-3xl font-bold font-mono">Đặt lịch ngày trực quan</div>

      {/* Phần DatePicker */}
      <div className="bg-white text-black mt-4 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <Legend />
          <DatePicker value={selectedDate} onDateChange={handleDateChange} />
        </div>
        {/* Nút "View yards & Price list" bên dưới DatePicker */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setShowPricingModal(true)}
            className="text-green-900 font-semibold border-b border-[#CEE86B] hover:opacity-80 transition"
          >
            View yards &amp; Price list
          </button>
        </div>
        <p className="text-red-500 mt-2">
          Nếu bạn cần đặt lịch cố định, vui lòng liên hệ: 0918.773.883 để được hỗ trợ.
        </p>
      </div>

      {/* Bảng booking */}
      {courts.length > 0 ? (
        <BookingTable
          courts={courts}
          bookingData={mergedMapping}
          toggleBookingStatus={toggleBookingStatus}
          times={times}
          slotCount={slotCount}
          currentUserId={userId}
        />
      ) : (
        <div>Đang tải dữ liệu...</div>
      )}

      {/* Footer: hiển thị khi đã chọn ít nhất 1 slot */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-green-700 text-white">
          {/* Nút toggle nhỏ */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-8 h-8 bg-white text-green-700 rounded-full flex items-center justify-center shadow transition duration-300 hover:opacity-80 hover:scale-105 active:opacity-70 active:scale-95 ${toggleAnimating ? "opacity-50 transform scale-90" : ""}`}
            >
              {isExpanded ? "v" : "^"}
            </button>
          </div>

          {/* Nếu expanded, hiển thị chi tiết timeslot theo sân */}
          {isExpanded && (
            <div className="px-4 pb-2">
              {groupSelectedSlots().map((item, idx) => (
                <div key={idx} className="inline-block mr-4">
                  {item.courtName}: {item.startStr} - {item.endStr}
                </div>
              ))}
              <hr className="my-2" />
            </div>
          )}

          {/* Tổng giờ & tổng tiền */}
          <div className="px-4 flex items-center justify-between mb-2">
            <div className="font-bold">Total hours: {totalHours}h00</div>
            <div className="font-bold">Total amount: {formatMoney(totalAmount)}</div>
          </div>

          {/* Nút CONTINUE với hiệu ứng ripple */}
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-t-xl bg-yellow-300 text-black font-bold transition duration-500 ease-in-out hover:opacity-80 hover:scale-105 active:opacity-70 active:scale-95"
          >
            CONTINUE
          </button>
        </div>
      )}

      {/* Modal xác nhận */}
      {showModal && (
        <ModalConfirmation
          onAction={handleModalAction}
          totalAmount={totalAmount}
        />
      )}

      {/* Modal Pricing Table */}
      {showPricingModal && (
        <PricingTable
          centerId={centerId}
          onClose={() => setShowPricingModal(false)}
        />
      )}
    </div>
  );
};

export default BookingSchedule;
