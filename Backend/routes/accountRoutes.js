import express from "express";
import { updateAdminProfile } from "../controllers/accountController.js";

const router = express.Router();

router.put("/profile", updateAdminProfile);

export default router;
