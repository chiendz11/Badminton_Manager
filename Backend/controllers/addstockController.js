// controllers/addstockController.js
import { getAllInventories, createInventory } from '../services/addstockService.js';

/**
 * Controller lấy danh sách tất cả hàng trong kho
 */
export async function getAllInventoriesController(req, res) {
  try {
    const inventories = await getAllInventories();
    return res.status(200).json(inventories);
  } catch (error) {
    console.error('Error fetching inventories:', error);
    return res.status(500).json({ error: 'Error fetching inventories' });
  }
}

/**
 * Controller thêm mới một mặt hàng
 */
export async function addNewInventoryController(req, res) {
  try {
    // Dữ liệu gửi từ client
    const {
      name,
      category,
      centerId,
      supplier,
      unitImport,
      unitImportQuantity,
      unitSell,
      quantity,
      barcode,
      image,
      importPrice,
      price,
      bulkPrice,
    } = req.body;

    // Kiểm tra sơ bộ (ví dụ: trường nào bắt buộc)
    if (!name || !category || !supplier) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc (name, category, supplier, ...)' });
    }

    // Tạo document mới
    const newData = {
      name,
      category,
      centerId,
      supplier,
      unitImport,
      unitImportQuantity,
      unitSell,
      quantity,
      barcode,
      image,
      importPrice,
      price,
      bulkPrice,
    };

    const newInventory = await createInventory(newData);

    return res.status(201).json({
      message: 'Thêm hàng vào kho thành công!',
      data: newInventory,
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return res.status(500).json({ error: 'Error creating inventory' });
  }
}
