import express from "express";
import {

  getInventoryList,   // ← import thêm

} from "../controllers/inventoryController.js";
import { protect, restrictToClient } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/list", protect, restrictToClient, getInventoryList);

export default router;