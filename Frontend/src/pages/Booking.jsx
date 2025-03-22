// src/pages/BookingSchedule.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "../components/datepicker";
import Legend from "../components/legend";
import BookingTable from "../components/bookingTable";
import PricingTable from "../components/PricingTable";
import ModalConfirmation from "../components/ModalConfirmation";
import socket from "../socket";
import { getCourtsByCenter, getPriceForTimeslot } from "../apis/courts";
// Sử dụng API getPendingMapping (backend đã merge dữ liệu: booked, pending, myPending)
import { getPendingMapping, confirmBookingToDB, clearAllPendingBookings } from "../apis/booking";

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

/**
 * Hàm applyLockedLogic:
 * Nếu selectedDate là hôm nay và một timeslot chưa "đã đặt" mà giờ của slot đã vượt,
 * thì chuyển trạng thái đó thành "locked".
 */
function applyLockedLogic(mapping, selectedDate) {
  const updatedMapping = JSON.parse(JSON.stringify(mapping)); // copy sâu
  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (selectedDate === todayStr) {
    Object.keys(updatedMapping).forEach((courtId) => {
      const arr = updatedMapping[courtId] || Array(slotCount).fill("trống");
      updatedMapping[courtId] = arr.map((status, i) => {
        if (status !== "đã đặt") {
          const slotHour = times[i];
          if (slotHour < currentHour || (slotHour === currentHour && currentMinute > 0)) {
            return "locked";
          }
        }
        return status;
      });
    });
  }
  return updatedMapping;
}

/**
 * Hàm groupSelectedSlots:
 * Nhóm các timeslot theo từng sân và tách nhóm nếu không liên tiếp.
 * Ví dụ: nếu người dùng chọn [7,8,9] → hiển thị "7-9",
 * nếu chọn [7,9] → hiển thị 2 dòng: "7" và "9".
 */
function groupSelectedSlots(selectedSlots, courts) {
  const groups = [];
  // Tách theo từng sân
  const slotsByCourt = {};
  selectedSlots.forEach(({ courtId, slotVal }) => {
    if (!slotsByCourt[courtId]) slotsByCourt[courtId] = [];
    slotsByCourt[courtId].push(slotVal);
  });
  Object.keys(slotsByCourt).forEach((courtId) => {
    // Sắp xếp theo thứ tự tăng dần
    const sorted = slotsByCourt[courtId].sort((a, b) => a - b);
    // Nhóm các slot liên tiếp
    let group = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) {
        group.push(sorted[i]);
      } else {
        groups.push({ courtId, slots: group });
        group = [sorted[i]];
      }
    }
    if (group.length) groups.push({ courtId, slots: group });
  });
  // Tạo kết quả hiển thị
  const result = groups.map(({ courtId, slots }) => {
    const courtObj = courts.find((c) => c._id === courtId);
    const courtName = courtObj ? courtObj.name : `Court ${courtId}`;
    if (slots.length === 1) {
      return { courtName, timeStr: formatSlot(slots[0]) };
    } else {
      // Hiển thị dạng "start - end" (end = slot cuối + 1)
      return { courtName, timeStr: `${formatSlot(slots[0])} - ${formatSlot(slots[slots.length - 1] + 1)}` };
    }
  });
  return result;
}

const BookingSchedule = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const query = new URLSearchParams(search);

  const userId = query.get("user") || "000000000000000000000001";
  const centerId = query.get("centerId") || "67ca6e3cfc964efa218ab7d7";
  const initialDate = query.get("date") || new Date().toISOString().split("T")[0];

  // Các state cơ bản
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [courts, setCourts] = useState([]);
  // baseMapping: dữ liệu gốc từ API; displayMapping: sau khi áp dụng locked
  const [baseMapping, setBaseMapping] = useState({});
  const [displayMapping, setDisplayMapping] = useState({});

  // State cho các ô đã chọn
  const [selectedSlots, setSelectedSlots] = useState([]);
  const { totalHours, totalAmount } = calculateTotal(selectedSlots);

  // Modal xác nhận và bảng giá
  const [showModal, setShowModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [initialMappingLoaded, setInitialMappingLoaded] = useState(false);

  // useRef để tránh race condition
  const fetchTokenRef = useRef(0);

  // 1. Lấy danh sách sân
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const data = await getCourtsByCenter(centerId);
        setCourts(Array.isArray(data) ? data : data.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sân:", error);
      }
    };
    fetchCourts();
  }, [centerId]);

  // 2. Clear pending khi load trang
  useEffect(() => {
    clearAllPendingBookings({ userId, centerId })
      .then(() => console.log("Clear pending thành công khi load"))
      .catch((err) => console.error("Lỗi clear pending khi load:", err));
  }, [userId, centerId]);

  // 3. Khi đổi ngày, reset dữ liệu và cập nhật selectedDate
  const handleDateChange = async (newDate) => {
    try {
      await clearAllPendingBookings({ userId, centerId });
      console.log("Clear pending thành công khi đổi ngày");
    } catch (error) {
      console.error("Lỗi clear pending khi đổi ngày:", error);
    }
    setBaseMapping({});
    setDisplayMapping({});
    setSelectedSlots([]);
    setInitialMappingLoaded(false);
    fetchTokenRef.current++;
    setSelectedDate(newDate);
  };

  // 4. Khi component unmount, clear pending
  useEffect(() => {
    return () => {
      clearAllPendingBookings({ userId, centerId })
        .then(() => console.log("Clear pending thành công khi unmount"))
        .catch((err) => console.error("Lỗi clear pending khi unmount:", err));
    };
  }, [userId, centerId]);

  // 5. Hàm reFetchMapping: gọi API getPendingMapping, lưu vào baseMapping và tính displayMapping
  const reFetchMapping = useCallback(
    async (targetDate, isInitial = false) => {
      if (courts.length === 0) return;
      const currentToken = ++fetchTokenRef.current;
      if (isInitial) setInitialMappingLoaded(false);
      try {
        const mapping = await getPendingMapping(centerId, targetDate);
        // Đảm bảo mỗi sân có mảng trạng thái đầy đủ
        const completeMapping = {};
        courts.forEach((court) => {
          completeMapping[court._id] = mapping[court._id] || Array(slotCount).fill("trống");
        });
        if (currentToken === fetchTokenRef.current) {
          setBaseMapping(completeMapping);
          const finalMapping = applyLockedLogic(completeMapping, targetDate);
          setDisplayMapping(finalMapping);
          if (isInitial) setInitialMappingLoaded(true);
        }
      } catch (error) {
        console.error("Lỗi khi fetch mapping:", error);
      }
    },
    [centerId, courts]
  );

  // 6. Khi selectedDate thay đổi, load mapping mới
  useEffect(() => {
    setBaseMapping({});
    setDisplayMapping({});
    reFetchMapping(selectedDate, true);
  }, [selectedDate, reFetchMapping]);

  // 7. Realtime qua Socket.IO: luôn gọi reFetchMapping cho ngày đang chọn
  useEffect(() => {
    const handleUpdateBookings = (data) => {
      reFetchMapping(selectedDate);
    };
    socket.on("updateBookings", handleUpdateBookings);
    return () => {
      socket.off("updateBookings", handleUpdateBookings);
    };
  }, [selectedDate, reFetchMapping]);

  // 8. Định kỳ cập nhật lại trạng thái locked mỗi phút dựa trên baseMapping
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayMapping(applyLockedLogic(baseMapping, selectedDate));
    }, 60000);
    return () => clearInterval(interval);
  }, [baseMapping, selectedDate]);

  // 9. Khi user click vào ô timeslot: thao tác nếu ô không bị locked
  const toggleBookingStatus = async (rowIndex, colIndex) => {
    if (!initialMappingLoaded) return;
    const courtId = courts[rowIndex]._id;
    const slotVal = times[colIndex];
    const todayStr = new Date().toISOString().split("T")[0];
    if (selectedDate === todayStr) {
      const now = new Date();
      if (slotVal < now.getHours() || (slotVal === now.getHours() && now.getMinutes() > 0)) {
        return;
      }
    }
    socket.emit("toggleBooking", { centerId, date: selectedDate, courtId, colIndex, userId });
    setSelectedSlots((prev) => {
      const foundIndex = prev.findIndex((s) => s.courtId === courtId && s.slotVal === slotVal);
      if (foundIndex > -1) {
        return prev.filter((_, idx) => idx !== foundIndex);
      } else {
        return [...prev, { courtId, slotVal, price: 0 }];
      }
    });
    try {
      const response = await getPriceForTimeslot({ centerId, date: selectedDate, timeslot: slotVal });
      if (response.success) {
        setSelectedSlots((prev) =>
          prev.map((s) =>
            s.courtId === courtId && s.slotVal === slotVal ? { ...s, price: response.price } : s
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi lấy giá cho timeslot:", error);
    }
  };

  // 10. Gom các timeslot đã chọn theo sân để hiển thị chi tiết
  // Nhóm theo từng sân và chia nhóm nếu không liên tiếp
  const groupSelectedSlots = () => {
    const groups = [];
    const slotsByCourt = {};
    selectedSlots.forEach(({ courtId, slotVal }) => {
      if (!slotsByCourt[courtId]) slotsByCourt[courtId] = [];
      slotsByCourt[courtId].push(slotVal);
    });
    Object.keys(slotsByCourt).forEach((courtId) => {
      const sorted = slotsByCourt[courtId].sort((a, b) => a - b);
      let group = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] + 1) {
          group.push(sorted[i]);
        } else {
          groups.push({ courtId, slots: group });
          group = [sorted[i]];
        }
      }
      if (group.length) groups.push({ courtId, slots: group });
    });
    const result = groups.map(({ courtId, slots }) => {
      const courtObj = courts.find((c) => c._id === courtId);
      const courtName = courtObj ? courtObj.name : `Court ${courtId}`;
      if (slots.length === 1) {
        return { courtName, timeStr: formatSlot(slots[0]) };
      } else {
        return { courtName, timeStr: `${formatSlot(slots[0])} - ${formatSlot(slots[slots.length - 1] + 1)}` };
      }
    });
    return result;
  };

  // 11. Khi nhấn nút CONTINUE, hiển thị modal xác nhận
  const handleConfirm = () => {
    setShowModal(true);
  };

  // 12. Xử lý modal: "pay" để xác nhận booking, "edit" để hủy
  const handleModalAction = async (action) => {
    if (action === "pay") {
      try {
        const { success, booking } = await confirmBookingToDB({ userId, centerId, date: selectedDate });
        if (success) {
          console.log("Booking pending lưu vào DB:", booking);
          localStorage.setItem("bookingExpiresAt", booking.expiresAt);
          console.log("Stored bookingExpiresAt:", localStorage.getItem("bookingExpiresAt"));
          alert(`Booking pending đã được lưu vào DB.\nBooking ID: ${booking._id}`);
          navigate(`/payment?user=${userId}&centerId=${centerId}&date=${selectedDate}&total=${totalAmount}`);
        }
      } catch (error) {
        console.error("Lỗi khi xác nhận booking:", error);
        alert("Lỗi khi xác nhận booking: " + error.message);
      }
    } else if (action === "edit") {
      setShowModal(false);
    }
  };

  const formatMoney = (val) => val.toLocaleString("vi-VN") + " đ";

  return (
    <div className="min-h-screen w-screen bg-green-900 text-white p-4 relative">
      {/* Tiêu đề */}
      <div className="text-center text-3xl font-bold font-mono">Đặt lịch sân trực quan</div>

      {/* Phần DatePicker */}
      <div className="bg-white text-black mt-4 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <Legend />
          <DatePicker value={selectedDate} onDateChange={handleDateChange} />
        </div>
        {/* Nút "View yards & Price list" */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setShowPricingModal(true)}
            className="text-green-900 font-semibold border-b border-[#CEE86B] hover:opacity-80 transition"
          >
            View yards &amp; Price list
          </button>
        </div>
        <p className="text-red-500 mt-2">
          Nếu bạn cần đặt lịch cố định, vui lòng liên hệ: 0982451906 để được hỗ trợ.
        </p>
      </div>

      {/* Hiển thị "Đang tải dữ liệu..." nếu mapping chưa load */}
      {!initialMappingLoaded && (
        <div className="mt-4 text-center text-2xl text-green-200">
          Đang tải dữ liệu...
        </div>
      )}

      {/* Bảng booking */}
      {initialMappingLoaded && courts.length > 0 ? (
        <BookingTable
          key={selectedDate}
          courts={courts}
          bookingData={displayMapping}
          toggleBookingStatus={toggleBookingStatus}
          times={times}
          slotCount={slotCount}
          currentUserId={userId}
          disableBooking={!initialMappingLoaded}
        />
      ) : (
        initialMappingLoaded && <div>Đang tải dữ liệu...</div>
      )}

      {/* Footer */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-green-700 text-white">
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 bg-white text-green-700 rounded-full flex items-center justify-center shadow transition duration-300 hover:opacity-80 hover:scale-105 active:opacity-70 active:scale-95"
            >
              {isExpanded ? "v" : "^"}
            </button>
          </div>
          {isExpanded && (
            <div className="px-4 pb-2">
              {groupSelectedSlots().map((item, idx) => (
                <div key={idx} className="inline-block mr-4">
                  {item.courtName}: {item.timeStr}
                </div>
              ))}
              <hr className="my-2 border-t-2 border-green-200" />
            </div>
          )}
          <div className="px-4 flex items-center justify-between mb-2">
            <div className="font-bold">Total hours: {totalHours}h00</div>
            <div className="font-bold">Total amount: {formatMoney(totalAmount)}</div>
          </div>
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
        <ModalConfirmation onAction={handleModalAction} totalAmount={totalAmount} />
      )}

      {/* Modal bảng giá */}
      {showPricingModal && (
        <PricingTable centerId={centerId} onClose={() => setShowPricingModal(false)} />
      )}
    </div>
  );
};

export default BookingSchedule;
