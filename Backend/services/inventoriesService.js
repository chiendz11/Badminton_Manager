// services/inventoryService.js
import Inventory from "../models/Inventories.js";
import StockHistory from "../models/stockhistory.js";

/**
 * Import stock: cập nhật inventory và tạo history
 * @param {{ inventoryId: string, centerId: string, supplier: string, quantityImport: number, importPrice: number }} params
 */
export async function importStock({ inventoryId, centerId, supplier, quantityImport, importPrice }) {
  // 1) Tìm mặt hàng
  const item = await Inventory.findById(inventoryId);
  if (!item) {
    const error = new Error("Không tìm thấy mặt hàng");
    error.statusCode = 404;
    throw error;
  }

  // 2) Tính toán tổng số lượng bán lẻ và tổng chi phí
  const totalAdded = quantityImport * item.unitImportQuantity;
  const totalCost = importPrice * quantityImport;

  // 3) Cập nhật inventory
  item.quantity += totalAdded;
  item.importPrice = importPrice;
  await item.save();

  // 4) Tạo record lịch sử
  const history = await StockHistory.create({
    inventoryId,
    centerId,
    supplier,
    quantityImport,
    unitImport: item.unitImport,
    unitImportQuantity: item.unitImportQuantity,
    totalAdded,
    importPrice,
    totalCost
  });

  return { item, history };
}

/**
 * Lấy lịch sử nhập hàng
 * @param {{ inventoryId?: string, centerId?: string }} filter
 */
export async function getStockHistory({ inventoryId, centerId }) {
  const query = {};
  if (inventoryId) query.inventoryId = inventoryId;
  if (centerId)    query.centerId = centerId;
  return StockHistory.find(query)
    .sort({ createdAt: -1 })
    .populate("inventoryId", "name category unitSell")
    .populate("centerId", "name location");
}

export async function getInventoryList({ centerId, category } = {}) {
  const query = {};
  if (centerId)  query.centerId  = centerId;
  if (category)  query.category  = category;
  return Inventory.find(query)
    .sort({ name: 1 })
    .populate("centerId", "name") 
    .lean();
}

export async function sellStock({ inventoryId, centerId, quantityExport, exportPrice }) {
  // 1. Tìm record kho phù hợp
  const inv = await Inventory.findOne({ _id: inventoryId, centerId });
  if (!inv) throw new Error('Không tìm thấy kho hàng');
  
  // 2. Kiểm tra đủ số lượng
  if (inv.quantity < quantityExport) {
    throw new Error('Số lượng trong kho không đủ');
  }

  // 3. Giảm số lượng và lưu
  inv.quantity -= quantityExport;
  await inv.save();

  // 4. Ghi vào lịch sử (giả sử model InventoryHistory có field `type: "export"`)
  await InventoryHistory.create({
    inventoryId,
    centerId,
    supplier: null,           // không cần nhà cung cấp khi xuất
    quantity: quantityExport,
    price: exportPrice,
    type: 'export',
    date: new Date()
  });

  return inv;
}