import Inventory from '../models/Inventories.js';

export async function getInventories() {
  try {
    // Truy vấn tất cả các document từ collection Inventories
    const inventories = await Inventory.find();
    return inventories;
  } catch (error) {
    throw error;
  }
}

// Hàm cập nhật số lượng tồn kho của sản phẩm
export async function updateInventoryQuantity(productId, orderQuantity) {
  try {
    console.log(`Updating inventory for productId: ${productId} with orderQuantity: ${orderQuantity}`);
    const updatedInventory = await Inventory.findByIdAndUpdate(
      productId,
      { $inc: { quantity: -orderQuantity } },
      { new: true }
    );
    console.log('Updated inventory:', updatedInventory);
    return updatedInventory;
  } catch (error) {
    console.error('Error in updateInventoryQuantity:', error);
    throw error;
  }
}

