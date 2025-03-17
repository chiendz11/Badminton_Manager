import Court from "../models/Courts.js";

export const getCourtsByCenterId = async (req, res) => {
    try {
        const { centerId } = req.params;
        console.log(`🔍 Nhận request lấy sân cho centerId: ${centerId}`);

        const courts= await Court.find({ centerId });

        console.log(`✅ Danh sách sân:`, courts);

        res.status(200).json({
            success: true,
            data: courts,
        });
    } catch (error) {
        console.error("❌ Lỗi lấy danh sách sân:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ" });
    }
};
