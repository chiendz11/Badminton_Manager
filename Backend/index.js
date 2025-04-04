import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoute.js";
import connectDB from "./config/Mongodb.js";
import centerRoute from "./routes/centerRoute.js";
import { initSocket } from "./config/socket.js";
import bookingPendingRoute from "./routes/bookingRoute.js";
import contactRoutes from "./routes/contactRoute.js"; // Import route liên hệ
import newsRoutes from "./routes/newsRoute.js"; // Import route tin tức
import ratingRoutes from "./routes/ratingRoute.js"; // Import route đánh giá

// Kết nối tới MongoDB
connectDB();

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

app.use("/api/users", userRoutes);
app.use("/api/centers", centerRoute);
app.use("/api/booking", bookingPendingRoute);
app.use("/api/contact", contactRoutes); 
app.use("/api/news", newsRoutes);
app.use("/api/ratings", ratingRoutes);

const server = http.createServer(app);

// Cấu hình Socket.IO với CORS tương tự
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
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
