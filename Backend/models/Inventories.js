import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true }, // Tên mặt hàng
  description: { type: String }, // Mô tả sản phẩm
  category: { type: String, required: true }, // Danh mục (Nước giải khát, Cầu lông...)
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true }, // Trung tâm sở hữu kho này
  supplier: { type: String, required: true }, // Nhà cung cấp

  // Đơn vị & số lượng
  unitImport: { type: String, required: true }, // Đơn vị nhập (Thùng, Kiện...)
  unitImportQuantity: { type: Number, required: true }, // 1 Thùng = ? Chai
  unitSell: { type: String, required: true }, // Đơn vị bán lẻ (Chai, Cái...)
  quantity: { type: Number, default: 0 }, // Số lượng hiện có (tính theo đơn vị bán lẻ)

  // Barcode & Hình ảnh
  barcode: { type: String, unique: true }, // Mã vạch để quét khi bán hàng
  image: { type: String }, // Hình ảnh sản phẩm

  // Giá cả
  importPrice: { type: Number, required: true }, // Giá nhập 1 thùng
  price: { type: Number, required: true }, // Giá bán lẻ (mỗi đơn vị bán)
  bulkPrice: { type: Number, required: true }, // Giá bán theo thùng
});

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;