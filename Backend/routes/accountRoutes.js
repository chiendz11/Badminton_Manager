// routes/accountRoutes.js
import express from "express";
import { getCurrentAdmin, updateAdminAccount } from "../controllers/accountController.js";

const router = express.Router();

router.get("/me", getCurrentAdmin);
router.put("/update", updateAdminAccount);

export default router;
