import express from 'express';
import { getAdminAccount, updateAdminAccount } from '../controllers/accountController.js';

const router = express.Router();

// Định nghĩa các endpoint cho tài khoản Admin
// Ví dụ: GET /api/admin/account/:id và PUT /api/admin/account/:id
router.get('/:id', getAdminAccount);
router.put('/:id', updateAdminAccount);

export default router;
