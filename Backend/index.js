import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import userRoutes from "./routes/userRoute.js";
import connectDB from "./config/Mongodb.js";
import courtRoute from "./routes/courtRoute.js";
import { initSocket } from "./config/socket.js";
import bookingPendingRoute from "./routes/bookingRoute.js";

// Kết nối tới MongoDB
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);
app.use("/api/courts", courtRoute);
app.use("/api/booking", bookingPendingRoute);


const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: "*" } });
initSocket(io);
global.io = io;
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server chạy trên cổng ${PORT}`));
app.get("/", (req, res) => {
  res.send("API is running....");
});
