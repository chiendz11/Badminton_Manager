// services/addstockService.js
import Inventory from '../models/Inventories.js';

/**
 * Lấy danh sách tất cả mặt hàng trong kho
 */
export async function getAllInventories() {
  try {
    const inventories = await Inventory.find();
    return inventories;
  } catch (error) {
    throw error;
  }
}

/**
 * Thêm mới một mặt hàng vào kho
 * @param {Object} data - Dữ liệu sản phẩm cần thêm
 * @returns {Object} Document vừa được tạo trong MongoDB
 */
export async function createInventory(data) {
  try {
    // Tạo một document mới trong collection Inventories
    const newInventory = new Inventory(data);
    const savedInventory = await newInventory.save();
    return savedInventory;
  } catch (error) {
    throw error;
  }
}
