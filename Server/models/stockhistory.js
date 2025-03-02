const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true }, // Sản phẩm nhập kho
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true }, // Trung tâm nhập hàng
  supplier: { type: String, required: true }, // Nhà cung cấp
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Nhân viên nhập kho

  quantityImport: { type: Number, required: true }, // Số lượng nhập (theo đơn vị nhập kho)
  unitImport: { type: String, required: true }, // Đơn vị nhập (Thùng, Kiện...)
  unitImportQuantity: { type: Number, required: true }, // 1 đơn vị nhập = ? đơn vị bán lẻ
  totalAdded: { type: Number, required: true }, // Tổng số lượng được cộng vào kho (quantityImport * unitImportQuantity)

  importPrice: { type: Number, required: true }, // Giá nhập 1 đơn vị nhập (Thùng, Kiện...)
  totalCost: { type: Number, required: true }, // Tổng chi phí nhập = importPrice * quantityImport

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("StockHistory", stockHistorySchema);
