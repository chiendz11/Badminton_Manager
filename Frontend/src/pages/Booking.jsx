// src/pages/BookingSchedule.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "../components/datepicker";
import Legend from "../components/legend";
import BookingTable from "../components/bookingTable";
import PricingTable from "../components/PricingTable";
import ModalConfirmation from "../components/ModalConfirmation";
import socket from "../socket";
import {
  getCourtsByCenter,
  getCourtStatusByBooking,
  getPriceForTimeslot,
} from "../apis/courts";
import {
  getPendingMapping,
  confirmBookingToDB,
  clearAllPendingBookings,
} from "../apis/booking";

const times = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
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

  // Các state cơ bản
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [courts, setCourts] = useState([]);
  const [bookedMapping, setBookedMapping] = useState({});
  const [pendingMapping, setPendingMapping] = useState({});
  const [mergedMapping, setMergedMapping] = useState({});

  // State cho các ô đã chọn (selectedSlots: { courtId, slotVal, price })
  const [selectedSlots, setSelectedSlots] = useState([]);
  const { totalHours, totalAmount } = calculateTotal(selectedSlots);

  // Modal xác nhận và modal bảng giá
  const [showModal, setShowModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  // State mở rộng hiển thị chi tiết bảng booking
  const [isExpanded, setIsExpanded] = useState(false);
  // State đánh dấu mapping đã load lần đầu
  const [initialMappingLoaded, setInitialMappingLoaded] = useState(false);

  // Sử dụng useRef để giữ token của mỗi lần fetch mapping
  const fetchTokenRef = useRef(0);

  // 1. Lấy danh sách sân từ API
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

  // 2. Clear pending trên server khi load trang (F5)
  useEffect(() => {
    clearAllPendingBookings({ userId, centerId })
      .then(() => console.log("Đã xóa cache pending khi load"))
      .catch((err) => console.error("Lỗi clear pending khi load:", err));
  }, [userId, centerId]);

  // 3. Khi đổi ngày, reset selectedSlots, clear mapping cũ và cập nhật selectedDate
  const handleDateChange = async (newDate) => {
    try {
      await clearAllPendingBookings({ userId, centerId });
      console.log("Đã xóa cache pending khi đổi ngày");
    } catch (error) {
      console.error("Lỗi clear pending khi đổi ngày:", error);
    }
    setPendingMapping({});
    setMergedMapping({});
    setSelectedSlots([]);
    setInitialMappingLoaded(false);
    // Tăng token để bỏ qua các phản hồi fetch cũ
    fetchTokenRef.current++;
    setSelectedDate(newDate);
  };

  // 4. Khi component unmount, clear pending trên server
  useEffect(() => {
    return () => {
      clearAllPendingBookings({ userId, centerId })
        .then(() => console.log("Đã xóa cache pending khi unmount"))
        .catch((err) => console.error("Lỗi clear pending khi unmount:", err));
    };
  }, [userId, centerId]);

  // 5. Hàm reFetchMapping: nhận vào targetDate và lấy dữ liệu booked và pending mapping từ API
  //    Sử dụng fetchToken để đảm bảo chỉ cập nhật nếu token chưa thay đổi
  const reFetchMapping = useCallback(
    async (targetDate, isInitial = false) => {
      if (courts.length === 0) return;
      // Lưu token hiện tại
      const currentToken = ++fetchTokenRef.current;
      if (isInitial) {
        setInitialMappingLoaded(false);
      }
      const booked = {};
      for (const court of courts) {
        try {
          const statusArray = await getCourtStatusByBooking(centerId, targetDate, court._id);
          booked[court._id] = statusArray;
        } catch (error) {
          booked[court._id] = Array(slotCount).fill("trống");
        }
      }
      const pending = await getPendingMapping(centerId, targetDate);
      // Kiểm tra token: nếu token đã thay đổi, bỏ qua cập nhật
      if (currentToken !== fetchTokenRef.current) {
        console.log("Fetch token không khớp, bỏ qua cập nhật mapping");
        return;
      }
      setBookedMapping(booked);
      setPendingMapping(pending);
      if (isInitial) {
        setInitialMappingLoaded(true);
      }
    },
    [centerId, courts]
  );

  // 6. Khi selectedDate thay đổi, load mapping mới dựa trên ngày mới
  useEffect(() => {
    // Reset mapping trước khi gọi API
    setBookedMapping({});
    setPendingMapping({});
    setMergedMapping({});
    reFetchMapping(selectedDate, true);
  }, [selectedDate, reFetchMapping]);

  // 7. Cập nhật mapping realtime qua Socket.IO (không dùng polling)
  useEffect(() => {
    const handleUpdateBookings = (data) => {
      // Chỉ cập nhật nếu sự kiện có ngày trùng với ngày hiện tại
      if (data.date === selectedDate) {
        reFetchMapping(selectedDate);
      }
    };
    socket.on("updateBookings", handleUpdateBookings);
    return () => {
      socket.off("updateBookings", handleUpdateBookings);
    };
  }, [selectedDate, reFetchMapping]);

  // 8. Tạo mergedMapping từ bookedMapping và pendingMapping, bổ sung trạng thái "locked"
  useEffect(() => {
    const merged = {};
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    courts.forEach((court) => {
      const courtId = court._id;
      const bookedArr = bookedMapping[courtId] || Array(slotCount).fill("trống");
      const pendingArr = pendingMapping[courtId] || Array(slotCount).fill("trống");
      const mergedArray = [];
      for (let i = 0; i < slotCount; i++) {
        let status = "trống";
        if (bookedArr[i] === "đã đặt") {
          status = "đã đặt";
        } else if (typeof pendingArr[i] === "object" && pendingArr[i] !== null) {
          status = pendingArr[i].userId === userId ? "myPending" : "pending";
        } else if (typeof pendingArr[i] === "string") {
          status = pendingArr[i];
        }
        // Nếu đặt trong ngày hôm nay, khóa các ô mà thời gian đã qua
        if (selectedDate === todayStr) {
          const slotHour = times[i];
          if (slotHour < currentHour || (slotHour === currentHour && currentMinute > 0)) {
            if (status !== "đã đặt") {
              status = "locked";
            }
          }
        }
        mergedArray[i] = status;
      }
      merged[courtId] = mergedArray;
    });
    setMergedMapping(merged);
  }, [bookedMapping, pendingMapping, courts, userId, selectedDate]);

  // 9. Nếu không còn ô "myPending" của user, reset selectedSlots và đóng modal xác nhận
  useEffect(() => {
    let hasMyPending = false;
    Object.values(mergedMapping).forEach((slotArr) => {
      if (slotArr.includes("myPending")) {
        hasMyPending = true;
      }
    });
    if (!hasMyPending) {
      console.log("Không còn ô myPending. Đặt lại selectedSlots và đóng modal.");
      setSelectedSlots([]);
      setShowModal(false);
    }
  }, [mergedMapping]);

  // 10. Khi user click vào ô timeslot: chỉ thao tác nếu mapping đã load và ô không bị khóa
  const toggleBookingStatus = async (rowIndex, colIndex) => {
    if (!initialMappingLoaded) return;
    const courtId = courts[rowIndex]._id;
    const slotVal = times[colIndex];
    // Nếu ngày hôm nay và slot đã qua, không cho thao tác
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

  // 11. Gom các timeslot đã chọn theo sân để hiển thị chi tiết
  const groupSelectedSlots = () => {
    const map = {};
    selectedSlots.forEach(({ courtId, slotVal }) => {
      if (!map[courtId]) map[courtId] = [];
      map[courtId].push(slotVal);
    });
    const result = [];
    Object.keys(map).forEach((cId) => {
      const arr = map[cId];
      const minSlot = Math.min(...arr);
      const maxSlot = Math.max(...arr);
      const courtObj = courts.find((c) => c._id === cId);
      const courtName = courtObj ? courtObj.name : `Court ${cId}`;
      result.push({
        courtName,
        startStr: formatSlot(minSlot),
        endStr: formatSlot(maxSlot + 1),
      });
    });
    return result;
  };

  // 12. Khi nhấn nút CONTINUE, hiển thị modal xác nhận
  const handleConfirm = () => {
    setShowModal(true);
  };

  // 13. Xử lý hành động từ modal xác nhận: "pay" để xác nhận, "edit" để hủy
  const handleModalAction = async (action) => {
    if (action === "pay") {
      try {
        const { success, booking } = await confirmBookingToDB({
          userId,
          centerId,
          date: selectedDate,
        });
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
          Nếu bạn cần đặt lịch cố định, vui lòng liên hệ: 0918.773.883 để được hỗ trợ.
        </p>
      </div>

      {/* Hiển thị "Đang tải dữ liệu..." chỉ khi mapping chưa load */}
      {!initialMappingLoaded && (
        <div className="mt-4 text-center text-2xl text-green-200">
          Đang tải dữ liệu...
        </div>
      )}

      {/* Bảng booking, sử dụng key={selectedDate} để ép render lại */}
      {initialMappingLoaded && courts.length > 0 ? (
        <BookingTable
          key={selectedDate}
          courts={courts}
          bookingData={mergedMapping}
          toggleBookingStatus={toggleBookingStatus}
          times={times}
          slotCount={slotCount}
          currentUserId={userId}
          disableBooking={!initialMappingLoaded}
        />
      ) : (
        initialMappingLoaded && <div>Đang tải dữ liệu...</div>
      )}

      {/* Footer: hiển thị khi có ít nhất 1 ô được chọn */}
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
                  {item.courtName}: {item.startStr} - {item.endStr}
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
