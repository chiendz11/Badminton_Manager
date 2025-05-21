import express from "express";
import { updateAdminProfile } from "../controllers/accountController.js";
import { protect, restrictToAdmin } from "../middleware/authMiddleware.js";
import csrfConfig from "../middleware/csrfConfig.js";

const router = express.Router();
const csrfProtection = csrfConfig;

router.put("/profile", protect, restrictToAdmin, csrfProtection, updateAdminProfile);

export default router;
