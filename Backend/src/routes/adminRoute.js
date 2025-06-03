// routes/adminRoutes.js
import express from 'express';
import { loginAdmin } from '../controllers/adminController.js';


const router = express.Router();

// Định nghĩa endpoint POST cho đăng nhập admin: /api/admin/login
router.post('/login', loginAdmin);
export default router;