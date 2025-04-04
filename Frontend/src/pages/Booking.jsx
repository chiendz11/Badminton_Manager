import React, { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "../components/datepicker";
import Legend from "../components/legend";
import BookingTable from "../components/bookingTable";
import PricingTable from "../components/PricingTable";
import ModalConfirmation from "../components/ModalConfirmation";
import socket from "../socket";
import { AuthContext } from "../contexts/AuthContext";

import { getCourtsByCenter, getPriceForTimeslot, getCenterInfoById } from "../apis/centers";
import { getPendingMapping, confirmBookingToDB, clearAllPendingBookings } from "../apis/booking";
import { fetchUserInfo } from "../apis/users";

import "../styles/booking.css";

const times = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const slotCount = times.length - 1;

function formatSlot(slot) {
  const hour = Math.floor(slot);
  const minute = (slot - hour) * 60;
  return `${hour}h${minute === 0 ? "00" : minute}`;
}

function calculateTotal(slots) {
  const totalAmount = slots.reduce((sum, s) => sum + s.price, 0);
  const totalHours = slots.length;
  return { totalHours, totalAmount };
}

/**
 * Nếu selectedDate là hôm nay và timeslot đã qua, chuyển trạng thái thành "locked".
 * Nếu trạng thái pending thuộc currentUser, giữ lại là "myPending".
 */
function applyLockedLogic(mapping, selectedDate, currentUserId) {
  const updatedMapping = JSON.parse(JSON.stringify(mapping));
  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  Object.keys(updatedMapping).forEach((courtId) => {
    const arr = updatedMapping[courtId] || Array(slotCount).fill("trống");
    updatedMapping[courtId] = arr.map((status, i) => {
      // Nếu status undefined, trả về mặc định "trống"
      if (status === undefined) return "trống";

      const slotHour = times[i];
      if (selectedDate === todayStr) {
        if (slotHour < currentHour || (slotHour === currentHour && currentMinute > 0)) {
          return "locked";
        }
      }
      if (typeof status === "object" && status.userId != null) {
        return status.userId.toString().trim() === currentUserId?.toString().trim()
          ? "myPending"
          : "pending";
      }
      return status;
    });
  });
  return updatedMapping;
}

const BookingSchedule = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  // Sử dụng optional chaining để tránh lỗi nếu user là null
  const userId = user?._id;

  const openHours = "05:00 - 24:00";
  const bookingData = JSON.parse(localStorage.getItem("bookingData") || "{}");
  const centerId = bookingData.centerId || "default_centerId";
  const initialDate = bookingData.date || new Date().toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [courts, setCourts] = useState([]);
  const [baseMapping, setBaseMapping] = useState({});
  const [displayMapping, setDisplayMapping] = useState({});
  const [centerInfo, setCenterInfo] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const { totalHours, totalAmount } = calculateTotal(selectedSlots);
  const [showModal, setShowModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [initialMappingLoaded, setInitialMappingLoaded] = useState(false);

  // Lấy thông tin trung tâm
  useEffect(() => {
    const fetchCenterInfo = async () => {
      try {
        const response = await getCenterInfoById(centerId);
        if (response && response.success) {
          setCenterInfo(response.center);
        }
      } catch (error) {
        console.error("Error fetching center info:", error);
      }
    };
    if (centerId) {
      fetchCenterInfo();
    }
  }, [centerId]);

  // Fetch danh sách sân và ngay sau đó fetch mapping
  useEffect(() => {
    const fetchCourtsAndMapping = async () => {
      try {
        const data = await getCourtsByCenter(centerId);
        const courtsData = Array.isArray(data) ? data : data.data;
        setCourts(courtsData);
        if (courtsData.length > 0) {
          // Gọi mapping ngay khi danh sách sân có dữ liệu
          const mapping = await getPendingMapping(centerId, selectedDate);
          const completeMapping = {};
          courtsData.forEach((court) => {
            completeMapping[court._id] =
              mapping[court._id] || Array(slotCount).fill("trống");
          });
          setBaseMapping(completeMapping);
          const finalMapping = applyLockedLogic(completeMapping, selectedDate, userId);
          setDisplayMapping(finalMapping);
          setInitialMappingLoaded(true);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sân:", error);
      }
    };
    fetchCourtsAndMapping();
  }, [centerId, selectedDate, userId]);

  useEffect(() => {
    if (!userId) return;
    clearAllPendingBookings({ userId, centerId }).catch((err) =>
      console.error("Lỗi clear pending khi load:", err)
    );
  }, [userId, centerId]);

  const handleDateChange = async (newDate) => {
    if (!userId) return;
    try {
      await clearAllPendingBookings({ userId, centerId });
    } catch (error) {
      console.error("Lỗi clear pending khi đổi ngày:", error);
    }
    setBaseMapping({});
    setDisplayMapping({});
    setSelectedSlots([]);
    setInitialMappingLoaded(false);
    setSelectedDate(newDate);
  };

  useEffect(() => {
    return () => {
      if (!userId) return;
      clearAllPendingBookings({ userId, centerId }).catch((err) =>
        console.error("Lỗi clear pending khi unmount:", err)
      );
    };
  }, [userId, centerId]);

  // Cập nhật mapping mỗi khi selectedDate thay đổi
  useEffect(() => {
    if (!userId || courts.length === 0) return;
    (async () => {
      try {
        const mapping = await getPendingMapping(centerId, selectedDate);
        const completeMapping = {};
        courts.forEach((court) => {
          completeMapping[court._id] =
            mapping[court._id] || Array(slotCount).fill("trống");
        });
        setBaseMapping(completeMapping);
        const finalMapping = applyLockedLogic(completeMapping, selectedDate, userId);
        setDisplayMapping(finalMapping);
      } catch (error) {
        console.error("Lỗi khi fetch mapping:", error);
      }
    })();
  }, [selectedDate, courts, userId]);

  useEffect(() => {
    const handleUpdateBookings = () => {
      if (userId && courts.length > 0) {
        (async () => {
          try {
            const mapping = await getPendingMapping(centerId, selectedDate);
            const completeMapping = {};
            courts.forEach((court) => {
              completeMapping[court._id] =
                mapping[court._id] || Array(slotCount).fill("trống");
            });
            setBaseMapping(completeMapping);
            const finalMapping = applyLockedLogic(completeMapping, selectedDate, userId);
            setDisplayMapping(finalMapping);
          } catch (error) {
            console.error("Lỗi khi fetch mapping:", error);
          }
        })();
      }
    };
    socket.on("updateBookings", handleUpdateBookings);
    return () => {
      socket.off("updateBookings", handleUpdateBookings);
    };
  }, [selectedDate, courts, userId, centerId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayMapping(applyLockedLogic(baseMapping, selectedDate, userId));
    }, 60000);
    return () => clearInterval(interval);
  }, [baseMapping, selectedDate, userId]);

  const toggleBookingStatus = async (rowIndex, colIndex) => {
    if (!initialMappingLoaded) return;
    const court = courts[rowIndex];
    if (!court) return;
    const courtId = court._id;
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
      const newSlots =
        foundIndex > -1
          ? prev.filter((_, idx) => idx !== foundIndex)
          : [...prev, { courtId, slotVal, price: 0 }];
      return newSlots;
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

  function groupSelectedSlots(selectedSlots, courts) {
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
    return groups.map(({ courtId, slots }) => {
      const courtObj = courts.find((c) => c._id === courtId);
      const courtName = courtObj ? courtObj.name : `Court ${courtId}`;
      return slots.length === 1
        ? { courtName, timeStr: formatSlot(slots[0]) }
        : { courtName, timeStr: `${formatSlot(slots[0])} - ${formatSlot(slots[slots.length - 1] + 1)}` };
    });
  }

  const handleConfirm = () => {
    setShowModal(true);
  };

  const handleModalAction = async (action) => {
    if (action === "confirm") {
      try {
        // Xác nhận booking chuyển từ pending sang booked
        const { success, booking } = await confirmBookingToDB({
          userId,
          centerId,
          date: selectedDate,
          totalAmount: totalAmount
        });
        if (success) {
          // Lưu các thông tin cần thiết vào localStorage
          localStorage.setItem("bookingExpiresAt", booking.expiresAt);
          localStorage.setItem("bookingId", booking._id);
          localStorage.setItem("userId", userId);
          localStorage.setItem("centerId", centerId);
          localStorage.setItem("selectedDate", selectedDate);
          localStorage.setItem("totalAmount", totalAmount);

          // Lấy các nhóm slot đã chọn (bao gồm courtName và timeStr)
          const slotGroups = groupSelectedSlots(selectedSlots, courts);
          localStorage.setItem("slotGroups", JSON.stringify(slotGroups));
          const updatedUserData = await fetchUserInfo(); // API này trả về dữ liệu user cập nhật
          setUser(updatedUserData.user);
          alert(`Booking pending đã được lưu vào DB.\nBooking ID: ${booking._id}`);

          // Điều hướng sang trang Payment
          navigate("/payment");
        }
      } catch (error) {
        console.error("Lỗi khi xác nhận booking:", error);
        alert("Lỗi khi xác nhận booking: " + error.message);
      }
    } else if (action === "cancel") {
      setShowModal(false);
    }
  };


  const formatMoney = (val) => val.toLocaleString("vi-VN") + " đ";
  const handleGoBack = () => {
    navigate("/centers");
  };
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const dayOfWeek = days[date.getDay()];
    return `${dayOfWeek}, ${day}/${month}/${year}`;
  };

  useEffect(() => {
    const newFiltered = selectedSlots.filter(({ courtId, slotVal }) => {
      const mapping = displayMapping[courtId];
      const index = times.indexOf(slotVal);
      return mapping && index !== -1 && mapping[index] === "myPending";
    });
    if (newFiltered.length !== selectedSlots.length) {
      setSelectedSlots(newFiltered);
    }
  }, [displayMapping]);

  return (
    <div className="booking-page">
      {!user ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading user data...</p>
        </div>
      ) : (
        <>
          <div className="booking-header">
            <button onClick={handleGoBack} className="back-button">
              <i className="fas fa-arrow-left"></i> Quay lại
            </button>
            <h1>Đặt sân</h1>
            <div></div>
          </div>

          {centerInfo && (
            <div className="center-info-bar">
              <div className="center-name">
                <i className="fas fa-building"></i> {centerInfo.name}
              </div>
              <div className="center-details">
                <span>
                  <i className="fas fa-map-marker-alt"></i> {centerInfo.address}
                </span>
                <span>
                  <i className="fas fa-phone-alt"></i> {centerInfo.phone}
                </span>
                <span>
                  <i className="fas fa-clock"></i> {openHours}
                </span>
                <span>
                  <i className="fas fa-table-tennis"></i> {centerInfo.totalCourts} sân
                </span>
              </div>
            </div>
          )}

          <div className="date-legend-container">
            <div className="current-date">
              <i className="fas fa-calendar-alt"></i>
              <span>{formatDisplayDate(selectedDate)}</span>
            </div>

            <div className="control-panel">
              <Legend />
              <div className="date-price-controls">
                <DatePicker value={selectedDate} onDateChange={handleDateChange} />
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="price-list-button"
                >
                  <i className="fas fa-tags"></i> Xem bảng giá
                </button>
              </div>
            </div>

            <div className="booking-reminder">
              <i className="fas fa-info-circle"></i>
              <p>
                Nếu bạn cần đặt lịch cố định, vui lòng liên hệ:{" "}
                <a href="tel:0918773883">0972.628.815</a> để được hỗ trợ.
              </p>
            </div>
          </div>

          {!initialMappingLoaded && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          )}

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
            initialMappingLoaded && (
              <div className="no-data-message">Không tìm thấy dữ liệu sân</div>
            )
          )}

          {selectedSlots.length > 0 && (
            <div className="booking-footer">
              <div className="expand-button-container">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="expand-button"
                  aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                >
                  <i className={`fas fa-chevron-${isExpanded ? "down" : "up"}`}></i>
                </button>
              </div>

              {isExpanded && (
                <div className="booking-details">
                  <h3>Chi tiết đặt sân:</h3>
                  <div className="selected-slots">
                    {groupSelectedSlots(selectedSlots, courts).map((item, idx) => (
                      <div key={idx} className="slot-item">
                        <span className="court-name">{item.courtName}:</span>
                        <span className="slot-time">{item.timeStr}</span>
                      </div>
                    ))}
                  </div>
                  <div className="divider"></div>
                </div>
              )}

              <div className="booking-summary">
                <div className="summary-item">
                  <span>Tổng thời gian:</span>
                  <span className="hours-value">{totalHours} giờ</span>
                </div>
                <div className="summary-item">
                  <span>Tổng tiền:</span>
                  <span className="amount-value">{formatMoney(totalAmount)}</span>
                </div>
              </div>

              <button onClick={handleConfirm} className="continue-button">
                <span>Tiếp tục</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}

          {showModal && (
            <ModalConfirmation
              onAction={handleModalAction}
              title="Xác nhận thanh toán"
              message={
                <>
                  Tổng số tiền thanh toán là{" "}
                  <span className="font-bold text-yellow-500">
                    {totalAmount.toLocaleString("vi-VN")} đ
                  </span>
                  . Nếu bạn xác nhận thanh toán, bạn sẽ có 5 phút để thanh toán (trong 5 phút đó không thể đặt sân tại trung tâm bạn vừa đặt nếu bạn thoát ra khỏi trang thanh toán, trừ khi bạn xóa booking giữ chỗ đó tại lịch đặt sắp tới ở phần thông tin cá nhân). Bạn có chắc chắn muốn thanh toán không?!{" "}
                  <span role="img" aria-label="thinking">🧐</span>
                </>
              }
            />
          )}

          {showPricingModal && (
            <PricingTable centerId={centerId} onClose={() => setShowPricingModal(false)} />
          )}
        </>
      )}
    </div>
  );
};

export default BookingSchedule;
