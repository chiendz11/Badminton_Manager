import * as service from "../services/inventoriesService.js";

/**
 * POST /api/inventory/import
 * Nhập hàng: tạo bản ghi lịch sử và cập nhật kho
 */
export async function importStock(req, res, next) {
  try {
    const { inventoryId, centerId, supplier, quantityImport, importPrice } = req.body;
    const result = await service.importStock({ inventoryId, centerId, supplier, quantityImport, importPrice });
    res.status(201).json({ message: "Nhập hàng thành công", data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/inventory/import-history
 * Lấy lịch sử nhập hàng (filter theo inventoryId hoặc centerId)
 */
export async function getStockHistory(req, res, next) {
  try {
    const { inventoryId, centerId } = req.query;
    const history = await service.getStockHistory({ inventoryId, centerId });
    res.json({ data: history });
  } catch (err) {
    next(err);
  }
}

export async function getInventoryList(req, res, next) {
  try {
    const { centerId, category } = req.query;
    const items = await service.getInventoryList({ centerId, category });
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

export async function sellStock (req, res){
  try {
    const { inventoryId, centerId, quantityExport, exportPrice } = req.body;
    const updatedInventory = await inventoryService.sellStock({
      inventoryId,
      centerId,
      quantityExport,
      exportPrice
    });
    res.status(200).json(updatedInventory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};