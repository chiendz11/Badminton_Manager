import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cookieParser from "cookie-parser";
import adminRoute from "./routes/adminRoute.js"; // Import route quản lý admin
import UserManageRoute from "./routes/userManageRoute.js"; // Import route quản lý người dùng
import userRoutes from "./routes/userRoute.js";
import connectDB from "./config/Mongodb.js";
import centerRoute from "./routes/centerRoute.js";
import { initSocket } from "./config/socket.js";
import bookingPendingRoute from "./routes/bookingRoute.js";
import contactRoutes from "./routes/contactRoute.js"; // Import route liên hệ
import newsRoutes from "./routes/newsRoutes.js"; // Import route tin tức
import billManageRoute from "./routes/billManageRoute.js"; // Import route quản lý bill
import centerStatusRoute from "./routes/centerStatusRoute.js"; // Import route trạng thái trung tâm
import path from "path"; // Thêm path để xử lý đường dẫn thư mục
import { fileURLToPath } from "url"; // Thêm để lấy đường dẫn file hiện tại
import inventoriesRoute from "./routes/inventoryRoutes.js";
import ratingClientRoute from "./routes/ratingsClientRoute.js";
import newsClientRoute from "./routes/newsClientRoute.js"; // Import route tin tức

import ratingRoute from "./routes/ratingRoutes.js";
import AccountRoute from "./routes/accountRoutes.js";
import sellHistoryRoutes from './routes/sellhistoryRoutes.js';
import Report from './routes/reportRoutes.js'
// Kết nối tới MongoDB
connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({ limit: "10mb" })); // Tăng limit để fix lỗi 413





// Cấu hình CORS: chỉ cho phép origin của client và bật credentials
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(cookieParser());

// Xác định đường dẫn tuyệt đối đến thư mục uploads
const uploadDir = path.join(__dirname, "uploads");

// Phục vụ file tĩnh từ thư mục uploads
app.use("/uploads", express.static(uploadDir));

app.use("/api/users", userRoutes);
app.use("/api/centers", centerRoute);
app.use("/api/booking", bookingPendingRoute);
app.use("/api/contact", contactRoutes);
app.use("/api/admin/news", newsRoutes);
app.use("/api/admin/user-manage", UserManageRoute); // Đường dẫn cho admin quản lý người dùng
app.use("/api/admin", adminRoute); // Đường dẫn cho admin quản lý trung tâm
app.use("/api/admin/bill-manage", billManageRoute); // Đường dẫn cho admin quản lý booking
app.use("/api/admin/center-status", centerStatusRoute);
app.use("/api/admin", adminRoute);
app.use("/api/admin/inventories", inventoriesRoute);
app.use("/api/admin/account", AccountRoute);
app.use('/api/admin/sell-histories', sellHistoryRoutes);
app.use('/api/admin/report/', Report);
app.use("/api/admin/ratings", ratingRoute);
app.use("/api/ratings", ratingClientRoute); // Đường dẫn cho quản lý lịch sử bán hàng
app.use("/api/news", newsClientRoute); // Đường dẫn cho quản lý lịch sử bán hàng
const server = http.createServer(app);

// Cấu hình Socket.IO với CORS tương tự
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  },
});
initSocket(io);
global.io = io;

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server chạy trên cổng ${PORT}`));

app.get("/", (req, res) => {
  res.send("API is running....");
});
