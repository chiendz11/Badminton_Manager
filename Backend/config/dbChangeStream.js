// src/config/dbChangeStream.js
import Booking from "../models/bookings.js";
import { getFullPendingMapping } from "../services/bookingServices.js";

export const watchBookingChanges = (io) => {
  try {
    // Bắt đầu changeStream trên collection Booking, fullDocument: "updateLookup" để có document đầy đủ
    const changeStream = Booking.watch([], { fullDocument: "updateLookup" });
    
    changeStream.on("change", async (change) => {
      console.log("Change detected in Booking collection:", change.operationType);

      // Nếu document bị xóa hoặc nếu status được cập nhật mà không còn là "pending"
      if (
        change.operationType === "delete" ||
        (change.operationType === "update" &&
          change.updateDescription.updatedFields &&
          change.updateDescription.updatedFields.status &&
          change.updateDescription.updatedFields.status !== "pending")
      ) {
        let centerId, date;
        if (change.fullDocument) {
          centerId = change.fullDocument.centerId.toString();
          date = change.fullDocument.date;
        } else {
          // Với sự kiện delete không có fullDocument, bạn có thể sử dụng thông tin mặc định,
          // hoặc nếu có thiết lập key để lưu trữ thông tin thì parse từ đó.
          centerId = "67ca6e3cfc964efa218ab7d7"; // Thay bằng giá trị mặc định hoặc logic riêng
          date = new Date().toISOString().split("T")[0];
        }
        console.log(`Change event for center=${centerId} date=${date}`);

        // Gọi hàm lấy danh sách booking pending dựa trên centerId và date
        const mapping = await getFullPendingMapping(centerId, date);
        // Phát sự kiện cập nhật booking lên client qua Socket.io
        io.emit("updateBookings", { date, mapping });
      }
    });
    
    changeStream.on("error", (error) => {
      console.error("Error in Booking Change Stream:", error);
    });
  } catch (error) {
    console.error("Error setting up Booking Change Stream:", error);
  }
};
