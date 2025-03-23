import React from "react";

/**
 * BookingTable (phiên bản dành cho Admin):
 * - Chỉ hiển thị 2 trạng thái: "booked" (màu đỏ) và "pending" (màu vàng).
 * - Các ô không thuộc 2 trạng thái trên sẽ hiển thị màu trắng (trống).
 * - Không cho người dùng click để toggle.
 */
const BookingTable = ({ courts, bookingData, times, slotCount }) => {
  return (
    <div className="mt-4 bg-green-100 p-4 rounded-md overflow-auto">
      <table className="table-fixed w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {/* Cột đầu (tên sân) */}
            <th
              className="p-3 bg-green-100 text-center font-bold text-black"
              style={{ width: "100px" }}
            ></th>
            {/* Các cột giờ */}
            {Array.from({ length: slotCount }, (_, i) => {
              const startHour = times[i];
              const endHour = times[i + 1];
              return (
                <th
                  key={i}
                  className="bg-green-100 text-black relative"
                  style={{ width: "80px" }}
                >
                  {/* Vạch chia giờ bên trái */}
                  <div
                    className="absolute bottom-0 bg-yellow-500"
                    style={{ left: "-0.5px", width: "2px", height: "6px" }}
                  />
                  {/* Hiển thị giờ bắt đầu */}
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
                  {/* Hiển thị giờ kết thúc ở cột cuối */}
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
              {/* Cột tên sân */}
              <td
                className="bg-green-200 text-black text-center font-bold"
                style={{ width: "100px", padding: "4px" }}
              >
                {court.name}
              </td>

              {/* Các cột trạng thái */}
              {Array.from({ length: slotCount }, (_, colIndex) => {
                // Lấy trạng thái từ bookingData
                const rawStatus =
                  bookingData && bookingData[court._id]
                    ? bookingData[court._id][colIndex]
                    : "trống"; // Hoặc xem như 'none'

                // Xác định 2 trạng thái chính: "booked" và "pending"
                // Những trạng thái khác coi như "trống" => trắng
                let status;
                if (rawStatus === "đã đặt" || rawStatus === "booked") {
                  status = "booked";
                } else if (rawStatus === "pending") {
                  status = "pending";
                } else {
                  status = "none"; // Xem như ô trống
                }

                // Chọn màu nền cho 2 trạng thái
                const bgColor =
                  status === "booked"
                    ? "bg-red-500"
                    : status === "pending"
                    ? "bg-yellow-500"
                    : "bg-white"; // none => trắng

                // Màu chữ (nếu cần)
                const textColor =
                  status === "booked" || status === "pending"
                    ? "text-white"
                    : "text-black";

                return (
                  <td
                    key={colIndex}
                    style={{
                      width: "80px",
                      height: "40px",
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
