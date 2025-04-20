import SellHistory from "../models/sellhistory.js";
import Inventory from "../models/Inventories.js";

/**
 * Lấy tất cả hóa đơn bán hàng
 * @returns {Promise<Array>} Mảng SellHistory
 */
export async function getAllSellHistories() {
  return await SellHistory.find()
    .populate("items.inventoryId")
    .sort({ createdAt: -1 });
}

/**
 * Tạo mới một hóa đơn bán hàng và cập nhật tồn kho
 * @param {Object} data - Dữ liệu hóa đơn
 * @param {String} data.centerId
 * @param {Array} data.items [{ inventoryId, quantity, unitPrice }]
 * @param {Number} data.totalAmount
 * @param {String} data.paymentMethod
 * @param {Object} data.customer
 */
export async function createSellHistory(data) {
  // Cập nhật tồn kho
  for (const item of data.items) {
    const inv = await Inventory.findById(item.inventoryId);
    if (!inv) throw new Error(`Inventory ${item.inventoryId} không tồn tại`);
    if (inv.quantity < item.quantity) throw new Error(`Tồn kho không đủ cho sản phẩm ${inv.name}`);
    inv.quantity -= item.quantity;
    await inv.save();
  }

  // Tính tổng thành tiền từng mục
  const itemsWithTotal = data.items.map(item => ({
    ...item,
    totalPrice: item.quantity * item.unitPrice
  }));

  // Tạo hóa đơn
  const invoice = new SellHistory({
    invoiceNumber: data.invoiceNumber,
    centerId: data.centerId,
    items: itemsWithTotal,
    totalAmount: data.totalAmount,
    paymentMethod: data.paymentMethod,
    customer: data.customer
  });
  return await invoice.save();
}