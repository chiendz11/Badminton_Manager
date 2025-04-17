import React from "react";

/**
 * BookingTable (phiên bản dành cho Admin):
 * - Hiển thị các trạng thái:
 *   - "booked" (màu đỏ)
 *   - "pending" (màu vàng)
 *   - "locked" (màu xám)
 *   - "trống" (màu trắng)
 * - Không cho người dùng click để toggle.
 */
const BookingTable = ({ courts, bookingData, times, slotCount }) => {
  return (
    <div className="mt-4 transparent p-2 rounded-md">
      <table className="table-fixed w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              className="p-2 transparent text-center font-bold text-black"
              style={{ width: "60px" }}
            ></th>
            {Array.from({ length: slotCount }, (_, i) => {
              const startHour = times[i];
              const endHour = times[i + 1];
              return (
                <th
                  key={i}
                  className="transparent text-black relative"
                  style={{ width: "40px" }}
                >
                  <div
                    className="absolute bottom-0 bg-yellow-500"
                    style={{ left: "-0.5px", width: "2px", height: "6px" }}
                  />
                  <div
                    className="absolute font-bold text-[10px]"
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
                        className="absolute font-bold text-[10px]"
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
                style={{ width: "60px", padding: "2px" }}
              >
                {court.name}
              </td>

              {Array.from({ length: slotCount }, (_, colIndex) => {
                const rawStatus =
                  bookingData &&
                  bookingData[court._id] &&
                  Array.isArray(bookingData[court._id]) &&
                  colIndex < bookingData[court._id].length
                    ? bookingData[court._id][colIndex]
                    : "trống";

                const statusStr = typeof rawStatus === "string" ? rawStatus.toLowerCase() : "trống";

                let status;
                if (statusStr.includes("đã đặt") || statusStr.includes("booked")) {
                  status = "booked";
                } else if (statusStr.includes("pending")) {
                  status = "pending";
                } else if (statusStr.includes("locked")) {
                  status = "locked";
                } else {
                  status = "none";
                }

                const bgColor =
                  status === "booked"
                    ? "bg-red-500"
                    : status === "pending"
                    ? "bg-yellow-500"
                    : status === "locked"
                    ? "bg-gray-300"
                    : "bg-white";

                const textColor =
                  status === "booked" || status === "pending"
                    ? "text-white"
                    : "text-black";

                return (
                  <td
                    key={colIndex}
                    style={{
                      width: "40px",
                      height: "30px",
                      padding: "0",
                      border: "1px solid black",
                    }}
                  >
                    <div
                      className={`h-full flex items-center justify-center ${bgColor} ${textColor}`}
                    >
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