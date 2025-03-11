// BookingSchedule.jsx
import React, { useState, useEffect, useCallback } from "react";
import DatePicker from "../components/datePicker";
import socket from "../socket";
import { getCourtsByCenter } from "../apis/courts";
import { getBookingStatusByCourt } from "../apis/courtStatus";
import { getPendingMapping } from "../apis/bookingPending";

// Lấy userId từ URL (ví dụ: ?user=000000000000000000000001)
const params = new URLSearchParams(window.location.search);
const currentUserId = params.get("user") || "000000000000000000000001";
console.log("Current UserId:", currentUserId);

// Mảng giờ cố định từ 5 đến 24 (tạo ra 19 slot)
const times = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
const slotCount = times.length - 1;

const Legend = () => (
  <div className="flex space-x-4">
    <div className="flex items-center space-x-2">
      <span className="w-4 h-4 bg-white border border-black" />
      <span>Trống</span>
    </div>
    <div className="flex items-center space-x-2">
      <span className="w-4 h-4 bg-yellow-500" />
      <span>Pending (User khác)</span>
    </div>
    <div className="flex items-center space-x-2">
      <span className="w-4 h-4 bg-green-500" />
      <span>Pending (Của tôi)</span>
    </div>
    <div className="flex items-center space-x-2">
      <span className="w-4 h-4 bg-red-500" />
      <span>Đã đặt</span>
    </div>
  </div>
);

const BookingTable = ({ courts, bookingData, toggleBookingStatus }) => {
  return (
    <div className="mt-4 bg-green-100 p-4 rounded-md overflow-auto">
      <table className="table-fixed w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {/* Cột đầu tiên để hiển thị tên sân */}
            <th className="p-3 bg-green-100 text-center font-bold text-black" style={{ width: "100px" }}></th>
            {Array.from({ length: slotCount }, (_, i) => {
              const startHour = times[i];
              const endHour = times[i + 1];
              return (
                <th key={i} className="bg-green-100 text-black relative" style={{ width: "80px" }}>
                  <div className="absolute bottom-0 bg-yellow-500" style={{ left: "-0.5px", width: "2px", height: "6px" }} />
                  <div className="absolute font-bold text-xs" style={{
                    left: 0,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    whiteSpace: "nowrap",
                  }}>
                    {startHour}:00
                  </div>
                  {i === slotCount - 1 && (
                    <>
                      <div className="absolute bottom-0 bg-yellow-500" style={{ right: "-0.5px", width: "2px", height: "5px" }} />
                      <div className="absolute font-bold text-xs" style={{
                        right: 0,
                        top: "50%",
                        transform: "translate(50%, -50%)",
                        whiteSpace: "nowrap",
                      }}>
                        {endHour}:00
                      </div>
                    </>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {courts.map((court, rowIndex) => (
            <tr key={rowIndex} style={{ border: "1px solid black" }}>
              <td className="bg-green-200 text-black text-center font-bold" style={{ width: "100px", padding: "4px" }}>
                {court.name}
              </td>
              {Array.from({ length: slotCount }, (_, colIndex) => {
                const rawStatus = bookingData && bookingData[court._id]
                  ? bookingData[court._id][colIndex]
                  : "trống";
                let status;
                if (typeof rawStatus === "object" && rawStatus !== null) {
                  status = rawStatus.userId === currentUserId ? "myPending" : "pending";
                } else {
                  status = rawStatus;
                }
                return (
                  <td
                    key={colIndex}
                    className="cursor-pointer relative"
                    style={{ width: "80px", height: "40px", padding: "0", border: "1px solid black" }}
                    onClick={() => toggleBookingStatus(rowIndex, colIndex)}
                  >
                    <div
                      className={`h-full flex items-center justify-center ${
                        status === "trống" ? "bg-white text-black" :
                        status === "pending" ? "bg-yellow-500 text-black" :
                        status === "myPending" ? "bg-green-500 text-white" :
                        status === "đã đặt" ? "bg-red-500 text-white" : "bg-gray-500 text-white"
                      }`}
                    ></div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BookingSchedule = () => {
  const centerId = "67ca6e3cfc964efa218ab7d7";
  const today = new Date().toISOString().split("T")[0];

  const [courts, setCourts] = useState([]);
  const [bookedMapping, setBookedMapping] = useState({}); // từ API: "đã đặt"
  const [pendingMapping, setPendingMapping] = useState({}); // raw mapping pending từ API/Socket
  const [mergedMapping, setMergedMapping] = useState({});
  const [selectedDate, setSelectedDate] = useState(today);

  // Hiển thị currentUserId ở đầu trang
  useEffect(() => {
    console.log("Current UserId:", currentUserId);
  }, []);

  // 1. Lấy danh sách sân từ API
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

  // 2. Lấy mapping "đã đặt" từ API
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

  // 3. Lấy mapping pending từ API khi trang load/refesh
  useEffect(() => {
    const fetchPendingMapping = async () => {
      try {
        const mapping = await getPendingMapping(centerId, selectedDate);
        console.log("Fetched pending mapping from API:", JSON.stringify(mapping, null, 2));
        setPendingMapping(mapping);
      } catch (error) {
        console.error("Error fetching pending mapping:", error);
      }
    };
    fetchPendingMapping();
  }, [centerId, selectedDate]);

  // 4. Lắng nghe realtime pending mapping từ Socket và cập nhật merged mapping ngay
  useEffect(() => {
    socket.on("updateBookings", (data) => {
      console.log("Received updateBookings event (pending mapping):", JSON.stringify(data, null, 2));
      setPendingMapping(data);
      // Cập nhật merged mapping ngay lập tức dựa trên data mới:
      setMergedMapping(prev => {
        const merged = {};
        courts.forEach((court) => {
          const courtId = court._id;
          const booked = bookedMapping[courtId] || Array(slotCount).fill("trống");
          const pending = data[courtId] || Array(slotCount).fill("trống");
          const mergedArray = [];
          for (let i = 0; i < slotCount; i++) {
            if (booked[i] === "đã đặt") {
              mergedArray[i] = "đã đặt";
            } else if (typeof pending[i] === "object" && pending[i] !== null) {
              mergedArray[i] = pending[i].userId === currentUserId ? "myPending" : "pending";
            } else {
              mergedArray[i] = "trống";
            }
          }
          merged[courtId] = mergedArray;
        });
        console.log("Merged mapping (socket):", JSON.stringify(merged, null, 2));
        return merged;
      });
    });
    return () => {
      socket.off("updateBookings");
    };
  }, [courts, bookedMapping, currentUserId]);

  // 5. Hợp nhất mapping khi bookedMapping hoặc pendingMapping thay đổi
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
    console.log("Merged mapping:", JSON.stringify(merged, null, 2));
    setMergedMapping(merged);
  }, [bookedMapping, JSON.stringify(pendingMapping), courts, currentUserId, slotCount]);

  // 6. Khi click vào ô, gửi event qua Socket kèm userId để toggle pending
  const toggleBookingStatus = (rowIndex, colIndex) => {
    const courtId = courts[rowIndex]._id;
    console.log(`Toggling slot for court ${courtId} at colIndex ${colIndex} on date ${selectedDate}`);
    socket.emit("toggleBooking", { centerId, date: selectedDate, courtId, colIndex, userId: currentUserId });
  };

  // 7. Khi DatePicker thay đổi ngày
  const handleDateChange = (newDate) => {
    console.log("DatePicker selected date:", newDate);
    setSelectedDate(newDate);
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
          <DatePicker onDateChange={handleDateChange} />
        </div>
        <p className="text-red-500 mt-2">
          Lưu ý: Nếu bạn cần đặt lịch cố định, vui lòng liên hệ: 0918.773.883 để được hỗ trợ.
        </p>
      </div>
      {courts.length > 0 ? (
        <BookingTable courts={courts} bookingData={mergedMapping} toggleBookingStatus={toggleBookingStatus} />
      ) : (
        <div>Đang tải dữ liệu...</div>
      )}
    </div>
  );
};

export default BookingSchedule;
