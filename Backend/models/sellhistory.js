import mongoose from "mongoose";

// Schema cho mục chi tiết trong hóa đơn
const sellItemSchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true }, // Tham chiếu đến sản phẩm
  quantity: { type: Number, required: true },  // Số lượng bán (đơn vị bán lẻ)
  unitPrice: { type: Number, required: true }, // Giá bán mỗi đơn vị
  totalPrice: { type: Number, required: true } // Thành tiền của mục
});

// Schema chính của hóa đơn bán hàng
const sellHistorySchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true }, // Mã hóa đơn
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true }, // Trung tâm thực hiện giao dịch
  items: { type: [sellItemSchema], required: true }, // Danh sách các mục hàng
  totalAmount: { type: Number, required: true }, // Tổng tiền của hóa đơn
  paymentMethod: { 
    type: String, 
    enum: ["Cash", "Card", "Other"], 
    default: "Cash" 
  }, // Phương thức thanh toán
  customer: {
    name: { type: String },    // Tên khách hàng (nếu có)
    contact: { type: String }  // Thông tin liên lạc của khách hàng
  }
}, { 
  timestamps: true // Tự động thêm createdAt và updatedAt
});

const SellHistory = mongoose.model("sellhistories", sellHistorySchema);
export default SellHistory;
