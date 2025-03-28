import React from "react";

const BookingTable = ({
  courts,
  bookingData,
  toggleBookingStatus,
  times,
  slotCount,
  currentUserId,
}) => {
  return (
    <div className="mt-4 bg-green-100 p-4 rounded-md overflow-auto">
      <table className="table-fixed w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              className="p-3 bg-green-100 text-center font-bold text-black"
              style={{ width: "100px" }}
            ></th>
            {Array.from({ length: slotCount }, (_, i) => {
              const startHour = times[i];
              const endHour = times[i + 1];
              return (
                <th key={i} className="bg-green-100 text-black relative" style={{ width: "80px" }}>
                  <div
                    className="absolute bottom-0 bg-yellow-500"
                    style={{ left: "-0.5px", width: "2px", height: "6px" }}
                  />
                  <div
                    className="absolute font-bold text-xs"
                    style={{
                      left: 0,
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {startHour}:00
                  </div>
                  {i === slotCount - 1 && (
                    <>
                      <div
                        className="absolute bottom-0 bg-yellow-500"
                        style={{ right: "-0.5px", width: "2px", height: "5px" }}
                      />
                      <div
                        className="absolute font-bold text-xs"
                        style={{
                          right: 0,
                          top: "50%",
                          transform: "translate(50%, -50%)",
                          whiteSpace: "nowrap",
                        }}
                      >
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
              <td
                className="bg-green-200 text-black text-center font-bold"
                style={{ width: "100px", padding: "4px" }}
              >
                {court.name}
              </td>
              {Array.from({ length: slotCount }, (_, colIndex) => {
                const rawStatus =
                  bookingData && bookingData[court._id]
                    ? bookingData[court._id][colIndex]
                    : "trống";
                const status =
                  typeof rawStatus === "object" && rawStatus !== null
                    ? rawStatus.userId.toString() === currentUserId.toString()
                      ? "myPending"
                      : "pending"
                    : rawStatus;
                
                // Chỉ cho phép thao tác nếu ô trống hoặc myPending
                const clickable = status === "trống" || status === "myPending";

                // Đặt màu nền dựa theo trạng thái
                const bgColor =
                  status === "trống"
                    ? "bg-white"
                    : status === "pending"
                    ? "bg-yellow-500"
                    : status === "myPending"
                    ? "bg-green-500"
                    : status === "đã đặt"
                    ? "bg-red-500"
                    : "bg-gray-500";
                const textColor =
                  status === "trống"
                    ? "text-black"
                    : status === "pending"
                    ? "text-black"
                    : status === "myPending"
                    ? "text-white"
                    : status === "đã đặt"
                    ? "text-white"
                    : "text-white";

                return (
                  <td
                    key={colIndex}
                    className="relative"
                    style={{
                      width: "80px",
                      height: "40px",
                      padding: "0",
                      border: "1px solid black",
                      pointerEvents: clickable ? "auto" : "none",
                      cursor: clickable ? "pointer" : "default",
                    }}
                    onClick={() => {
                      if (clickable) {
                        toggleBookingStatus(rowIndex, colIndex);
                      }
                    }}
                  >
                    <div className={`h-full flex items-center justify-center ${bgColor} ${textColor}`}>
                      {/* Không hiển thị text, chỉ hiển thị màu */}
                    </div>
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

export default BookingTable;
