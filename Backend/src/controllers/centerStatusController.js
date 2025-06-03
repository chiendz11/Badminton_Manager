import { getFullPendingMapping } from "../services/bookingServices.js"; // Import getFullPendingMapping
import { getAllCenters, getCourtsByCenter } from "../services/centerServices.js"; // Import getAllCenters và getCourtsByCenter từ centerServices.js

// Controller lấy toàn bộ danh sách các trung tâm (phiên bản admin)
export const getAllCentersController = async (req, res) => {
    try {
        // Gọi service để lấy danh sách trung tâm
        const centers = await getAllCenters();

        // Trả về dữ liệu
        res.status(200).json({ success: true, data: centers });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách trung tâm (admin):", error.message);
        res.status(500).json({ success: false, message: "Lỗi server khi lấy danh sách trung tâm" });
    }
};

// Controller lấy dữ liệu trạng thái sân theo trung tâm và ngày
export const getFullMappingController = async (req, res) => {
    try {
        const { centerId, date } = req.query;

        // Kiểm tra đầu vào
        if (!centerId || !date) {
            return res.status(400).json({ success: false, message: "Thiếu tham số centerId hoặc date" });
        }

        // Gọi service để lấy dữ liệu
        const mapping = await getFullPendingMapping(centerId, date);

        // Trả về dữ liệu
        res.status(200).json(mapping);
    } catch (error) {
        console.error("Lỗi khi lấy trạng thái sân (admin):", error.message);
        res.status(500).json({ success: false, message: "Lỗi server khi lấy trạng thái sân" });
    }
};

// Controller lấy danh sách sân theo trung tâm (phiên bản admin)
export const getCourtsByCenterController = async (req, res) => {
    try {
        const { centerId } = req.query;

        // Kiểm tra đầu vào
        if (!centerId) {
            return res.status(400).json({ success: false, message: "Thiếu tham số centerId" });
        }

        // Gọi service để lấy danh sách sân
        const courts = await getCourtsByCenter(centerId);

        // Trả về dữ liệu
        res.status(200).json({ success: true, data: courts });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách sân (admin):", error.message);
        res.status(500).json({ success: false, message: "Lỗi server khi lấy danh sách sân" });
    }
};