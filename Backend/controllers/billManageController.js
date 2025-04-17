// controllers/billManageController.js
import { getAllBillsWithDetails, updateBillStatusService, searchUsersService, getAllCentersService } from '../services/billManageServices.js';

// Controller to get all bills with details
export const getAllBillsController = async (req, res) => {
    try {
        const bills = await getAllBillsWithDetails();
        return res.status(200).json({
            success: true,
            message: 'Danh sách bill được lấy thành công',
            data: bills,
        });
    } catch (error) {
        console.error('Lỗi trong controller getAllBills:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách bill',
        });
    }
};

// Controller to update bill status
export const updateBillStatusController = async (req, res) => {
    try {
        const { billId, status } = req.body; // Lấy từ body thay vì query

        if (!billId || !status) {
            return res.status(400).json({
                success: false,
                message: "Thiếu billId hoặc status trong body",
            });
        }

        const updatedBill = await updateBillStatusService(billId, status);
        return res.status(200).json({
            success: true,
            message: `Cập nhật trạng thái bill thành ${status} thành công`,
            data: updatedBill,
        });
    } catch (error) {
        console.error('Lỗi trong controller updateBillStatus:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi cập nhật trạng thái bill',
        });
    }
};

// Controller to search users
export const searchUsersController = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: "Thiếu tham số query trong URL",
            });
        }

        const users = await searchUsersService(query);
        return res.status(200).json({
            success: true,
            message: 'Tìm kiếm người dùng thành công',
            data: users,
        });
    } catch (error) {
        console.error('Lỗi trong controller searchUsers:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi tìm kiếm người dùng',
        });
    }
};

// Controller to get all centers
export const getAllCentersController = async (req, res) => {
    try {
        const centers = await getAllCentersService();
        return res.status(200).json({
            success: true,
            message: 'Danh sách trung tâm được lấy thành công',
            data: centers,
        });
    } catch (error) {
        console.error('Lỗi trong controller getAllCenters:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Lỗi server khi lấy danh sách trung tâm',
        });
    }
};