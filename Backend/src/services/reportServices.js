import SellHistory from "../models/sellhistory.js";
import StockHistory from "../models/stockhistory.js";

export async function calculateReport({ centerId, startDate, endDate }) {
  const filter = {};
  if (centerId) filter.centerId = centerId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [sales, purchases] = await Promise.all([
    SellHistory.find(filter),
    StockHistory.find(filter)
  ]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCost = purchases.reduce((sum, p) => sum + p.totalCost, 0);

  return {
    totalRevenue,
    totalCost,
    profit: totalRevenue - totalCost,
    totalInvoices: sales.length,
    totalImports: purchases.length
  };
}

export async function calculateMonthlyReport(year, centerId) {
  const result = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    totalRevenue: 0,
    totalCost: 0,
    profit: 0
  }));

  const [sales, purchases] = await Promise.all([
    SellHistory.find({ centerId }),
    StockHistory.find({ centerId })
  ]);

  sales.forEach(s => {
    const month = new Date(s.createdAt).getMonth();
    result[month].totalRevenue += s.totalAmount;
  });

  purchases.forEach(p => {
    const month = new Date(p.createdAt).getMonth();
    result[month].totalCost += p.totalCost;
  });

  result.forEach(r => {
    r.profit = r.totalRevenue - r.totalCost;
  });

  return result;
}
