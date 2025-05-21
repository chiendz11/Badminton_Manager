import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import csrfConfig from "./middleware/csrfConfig.js";
import session from "express-session";
import dotenv from "dotenv";
import adminRoute from "./routes/adminRoute.js";
import UserManageRoute from "./routes/userManageRoute.js";
import userRoutes from "./routes/userRoute.js";
import connectDB from "./config/Mongodb.js";
import centerRoute from "./routes/centerRoute.js";
import { initSocket } from "./config/socket.js";
import bookingPendingRoute from "./routes/bookingRoute.js";
import contactRoutes from "./routes/contactRoute.js";
import newsRoutes from "./routes/newsRoutes.js";
import billManageRoute from "./routes/billManageRoute.js";
import centerStatusRoute from "./routes/centerStatusRoute.js";
import path from "path";
import { fileURLToPath } from "url";
import inventoriesRoute from "./routes/inventoryRoutes.js";
import ratingClientRoute from "./routes/ratingsClientRoute.js";
import newsClientRoute from "./routes/newsClientRoute.js";
import inventoryClientRoute from "./routes/inventoryClientRoutes.js";
import ratingRoute from "./routes/ratingRoutes.js";
import AccountRoute from "./routes/accountRoutes.js";
import sellHistoryRoutes from "./routes/sellhistoryRoutes.js";
import Report from "./routes/reportRoutes.js";
import sellHistoryRoutesClient from "./routes/sellhistoryRoutesClient.js";

// Load biến môi trường
dotenv.config();

// Kết nối tới MongoDB
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const csrfProtection = csrfConfig;

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "http://localhost:5173", "http://localhost:5174"],
        styleSrc: ["'self'", "'unsafe-inline'", "http://localhost:5173", "http://localhost:5174"],
        imgSrc: ["'self'", "data:", "http://localhost:5173", "http://localhost:5174"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", "ws://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
        frameSrc: ["'self'"],
      },
    },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Thêm PATCH vào methods
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    credentials: true,
  })
);
app.use(cookieParser());

// Cấu hình session TRƯỚC csurf
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? 'None' : 'Lax', // Có thể cần 'None' và secure: true cho cross-site cookie
    },
  })
);

// Endpoint để lấy CSRF token (có sẵn cho tất cả các frontend)
// Áp dụng csrfProtection cho chính endpoint này để nó có thể tạo token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const uploadDir = path.join(__dirname, "uploads");

// Phục vụ file tĩnh từ thư mục uploads
app.use('/uploads', express.static(uploadDir));

// Routes (sử dụng csrfProtection trong từng route cần thiết)
// Truyền csrfProtection vào các route files nếu chúng cần sử dụng
app.use("/api/users", userRoutes); // userRoutes sẽ import { csrfProtection } từ đây
app.use("/api/centers", centerRoute);
app.use("/api/booking", bookingPendingRoute);
app.use("/api/contact", contactRoutes);
app.use("/api/admin/news", newsRoutes);
app.use("/api/admin/user-manage", UserManageRoute);
app.use("/api/admin", adminRoute); // adminRoute sẽ import { csrfProtection } từ đây
app.use("/api/admin/bill-manage", billManageRoute);
app.use("/api/admin/center-status", centerStatusRoute);
app.use("/api/admin/inventories", inventoriesRoute);
app.use("/api/inventories", inventoryClientRoute);
app.use("/api/admin/account", AccountRoute);
app.use("/api/admin/sell-histories", sellHistoryRoutes);
app.use("/api/admin/report/", Report);
app.use("/api/admin/ratings", ratingRoute);
app.use("/api/ratings", ratingClientRoute);
app.use("/api/news", newsClientRoute);
app.use("/api/sell-histories", sellHistoryRoutesClient);

const server = http.createServer(app);

// Cấu hình Socket.IO với CORS tương tự
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
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

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error(err.stack); // Quay lại console.error
  res.status(500).json({ message: "Đã có lỗi xảy ra, vui lòng thử lại sau!" });
});