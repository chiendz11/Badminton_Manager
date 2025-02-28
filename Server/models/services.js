const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
    center_id: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true }, // Liên kết với trung tâm
    name: { type: String, required: true }, // Tên dịch vụ hoặc sản phẩm
    category: { type: String, required: true }, // Loại dịch vụ (drink, snack, coach, stringing,...)
    unit: { type: String, required: true }, // Đơn vị (chai, cái, giờ, lần, ...)
    price: { type: Number, required: true }, // Giá tiền
    quantity: { type: Number, required: true }, // Số lượng còn lại (HLV = số người, đồ uống = số chai,...)
    duration: { type: Number, default: null }, // Thời gian sử dụng (tính bằng phút, null nếu không áp dụng)
    image: { type: String, default: null }, // Link ảnh
    description: { type: String, default: "" }, // Mô tả dịch vụ
    available_hours: { // Giờ hoạt động
        start: { type: String, required: true }, // VD: "08:00"
        end: { type: String, required: true } // VD: "22:00"
    },
    created_at: { type: Date, default: Date.now }, // Ngày tạo
    updated_at: { type: Date, default: Date.now } // Ngày cập nhật
});

// Xuất model
const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;
