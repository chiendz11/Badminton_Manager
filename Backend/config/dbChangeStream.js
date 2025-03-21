// src/config/dbChangeStream.js
import Booking from "../models/bookings.js";
import { getFullPendingMapping } from "../services/bookingServices.js";

export const watchBookingChanges = (io) => {
  try {
    const changeStream = Booking.watch([], { fullDocument: "updateLookup" });
    changeStream.on("change", async (change) => {
      console.log("Change detected in Booking collection:", change.operationType);
      // Xử lý các trường hợp: xóa, cập nhật (nếu status không còn là "pending")
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
          // Với delete, không có fullDocument; bạn có thể lấy thông tin từ documentKey (nếu có lưu)
          // Ở đây sử dụng giá trị mặc định để demo
          centerId = "67ca6e3cfc964efa218ab7d7";
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
