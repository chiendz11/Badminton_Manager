    import express from "express";
    import cors from "cors";
    import http from "http";
    import { Server as SocketIOServer } from "socket.io";

    import connectDB from "./config/Mongodb.js";
    import courtRoute from "./routes/courtRoute.js";
    import courtStatusRoute from "./routes/courtStatusRoute.js"; // API booking status
    import  { initSocket } from "./config/socket.js";
    import adminRoute from "./routes/adminRoutes.js";
    import inventoriesRoute from "./routes/inventoryRoutes.js";
    import centerRoute from "./routes/centersRoute.js";
    import newsRoute from "./routes/newsRoutes.js";
    import ratingRoute from "./routes/ratingRoutes.js";
    import AccountRoute from "./routes/accountRoutes.js";
    import sellHistoryRoutes from './routes/sellhistoryRoutes.js';
    import Report from './routes/reportRoutes.js'

    

    // Kết nối tới MongoDB
    connectDB();

    const app = express();
    app.use(express.json());
    app.use(cors());

    app.use("/api/admin", adminRoute);
    app.use("/api/courts", courtRoute);
    app.use("/api/booking", courtStatusRoute);
    app.use("/api/inventories", inventoriesRoute);
    app.use("/api/centers", centerRoute);
    app.use("/api/news", newsRoute);
    app.use("/api/account", AccountRoute);
    app.use('/api/sell-histories', sellHistoryRoutes);
    app.use('/api/report/', Report);
    app.use("/api/ratings", ratingRoute);


    const server = http.createServer(app);
    const io = new SocketIOServer(server, { cors: { origin: "*" } });
    initSocket(io);
    global.io = io;
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`Server chạy trên cổng ${PORT}`));
    app.get("/", (req, res) => {
      res.send("API is running....");
    });

    
