import { getInventories as getInventoriesService, updateInventoryQuantity } from '../services/inventoriesService.js';

export async function getInventories(req, res) {
  try {
    const inventories = await getInventoriesService();
    res.status(200).json(inventories);
  } catch (error) {
    console.error("Error fetching inventories:", error);
    res.status(500).json({ error: "Error fetching inventories" });
  }
}

export async function createOrder(req, res) {
  try {
    const { cartItems } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const orderData = [];

    // Cập nhật tồn kho cho từng sản phẩm trong giỏ hàng
    for (const item of cartItems) {
      const updatedInventory = await updateInventoryQuantity(item._id, item.quantityInCart);
      if (!updatedInventory) {
        return res.status(404).json({ message: `Product with id ${item._id} not found` });
      }
      orderData.push({
        productId: item._id,
        name: item.name,
        quantity: item.quantityInCart,
        price: item.price,
      });
    }

    console.log("Order placed:", orderData);
    res.status(201).json({ message: "Order placed successfully", order: orderData });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Error creating order" });
  }
}
