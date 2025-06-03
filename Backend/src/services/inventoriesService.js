import Inventory from "../models/Inventories.js";
import StockHistory from "../models/stockhistory.js";

export async function importStock({ inventoryId, centerId, supplier, quantityImport, importPrice }) {
  if (!inventoryId) {
    throw new Error("Cannot read properties of undefined");
  }

  if (quantityImport <= 0) {
    throw new Error("Số lượng trong kho không đủ");
  }

  // 1) Tìm mặt hàng
  const item = await Inventory.findById(inventoryId).lean();
  if (!item) {
    throw new Error("Không tìm thấy mặt hàng");
  }

  // 2) Tính toán tổng số lượng và tổng chi phí 
  const totalAdded = quantityImport * item.unitImportQuantity;
  const totalCost = importPrice * quantityImport;

  // 3) Cập nhật inventory
  const newQuantity = item.quantity + totalAdded;
  const updatedItem = await Inventory.findByIdAndUpdate(
    inventoryId,
    { quantity: newQuantity, importPrice },
    { new: true }
  );

  // 4) Tạo record lịch sử
  const history = await StockHistory.create({
    inventoryId,
    centerId,
    supplier: supplier || '',
    quantityImport,
    unitImport: item.unitImport,
    unitImportQuantity: item.unitImportQuantity,
    totalAdded,
    importPrice,
    totalCost
  });

  return { item: updatedItem, history };
}

export async function getStockHistory({ inventoryId, centerId, year, month, supplier }) {
  const query = {};
  if (inventoryId) query.inventoryId = inventoryId;
  if (centerId) query.centerId = centerId;
  if (supplier) query.supplier = supplier;

  if (year && month) {
    const startDate = new Date(Date.UTC(year, month - 1));
    const endDate = new Date(Date.UTC(year, month));
    query.createdAt = {
      $gte: startDate,
      $lt: endDate
    };
  }

  return StockHistory.find(query)
    .sort({ createdAt: -1 })
    .populate("inventoryId", "name category unitSell")
    .populate("centerId", "name location")
    .lean();
}

export async function getInventoryList({ centerId, category, name, minPrice, maxPrice } = {}) {
  const query = {};
  if (centerId) query.centerId = centerId;
  if (category) query.category = category;
  if (name) query.name = { $regex: name, $options: 'i' };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = minPrice;
    if (maxPrice) query.price.$lte = maxPrice;
  }

  return Inventory.find(query)
    .sort({ name: 1 })
    .populate("centerId", "name")
    .lean();
}

export async function sellStock({ inventoryId, centerId, quantityExport, exportPrice }) {
  if (!inventoryId) {
    throw new Error("Cannot read properties of undefined");
  }

  if (quantityExport <= 0) {
    throw new Error("Số lượng trong kho không đủ");
  }

  // 1. Tìm record kho phù hợp
  const inv = await Inventory.findOne({ _id: inventoryId, centerId }).lean();
  if (!inv) throw new Error('Không tìm thấy kho hàng');

  // 2. Kiểm tra đủ số lượng
  if (inv.quantity < quantityExport) {
    throw new Error('Số lượng trong kho không đủ');
  }

  // 3. Giảm số lượng và lưu
  const newQuantity = inv.quantity - quantityExport;
  const updatedInv = await Inventory.findByIdAndUpdate(
    inventoryId,
    { quantity: newQuantity },
    { new: true }
  );

  // 4. Ghi vào lịch sử
  const historyData = {
    inventoryId,
    centerId,
    supplier: null,
    quantity: quantityExport,
    price: exportPrice,
    type: 'export',
    date: new Date()
  };

  await StockHistory.create(historyData);

  return updatedInv;
}