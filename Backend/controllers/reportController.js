import { calculateReport, calculateMonthlyReport } from "../services/reportServices.js";

export async function getRevenueAndCost(req, res, next) {
  try {
    const { centerId, startDate, endDate } = req.query;
    const result = await calculateReport({ centerId, startDate, endDate });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyReport(req, res, next) {
  try {
    const { centerId, year } = req.query;
    if (!year) return res.status(400).json({ success: false, message: "Thiếu năm cần thống kê" });
    const result = await calculateMonthlyReport(parseInt(year), centerId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
