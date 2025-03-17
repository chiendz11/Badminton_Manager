// src/config/dbChangeStream.js
import Booking from "../models/bookings.js";
import { getFullPendingMapping } from "../services/bookingServices.js";

export const watchBookingChanges = (io) => {
  try {
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
        // Lấy thông tin centerId và date
        let centerId, date;
        if (change.fullDocument) {
          centerId = change.fullDocument.centerId.toString();
          date = change.fullDocument.date;
        } else {
          // Với delete, không có fullDocument, bạn có thể sử dụng giá trị mặc định
          // Hoặc nếu có thể lưu trữ thông tin trong key, bạn có thể parse nó
          // Ví dụ: key format: pending:{centerId}:{date}:{userId}
          // Nếu không, ta sẽ dùng ngày hiện tại
          centerId = "67ca6e3cfc964efa218ab7d7"; // hoặc giá trị cụ thể
          date = new Date().toISOString().split("T")[0];
        }
        console.log(`Change event for center=${centerId} date=${date}`);
        const mapping = await getFullPendingMapping(centerId, date);
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
