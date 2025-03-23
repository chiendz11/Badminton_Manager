import express from 'express';
import { registerUser, getUserById } from '../controllers/userController.js';

const router = express.Router();
router.get("/getUsers", getUserById);
router.post("/register", registerUser);




export default router;