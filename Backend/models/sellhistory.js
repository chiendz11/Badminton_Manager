import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Schema cho từng mặt hàng trong hóa đơn
const SellItemSchema = new Schema({
  productId:   { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name:        { type: String, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true, min: 0 },
  totalPrice:  { type: Number, required: true, min: 0 }
});

// Schema chính cho lịch sử đơn hàng
const SellHistorySchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date:          { type: Date, default: Date.now },
  items:         { type: [SellItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  paymentMethod: { type: String, enum: ['cash', 'transfer', 'card', 'other'], default: 'cash' },
  note:          { type: String, default: '' },
  totalAmount:   { type: Number, required: true, min: 0 }
}, {
  timestamps: true // tạo thêm createdAt và updatedAt
});

export default model('SellHistory', SellHistorySchema);
