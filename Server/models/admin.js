const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin"], required: true },
    centers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Center" }], // Danh sách các trung tâm quản lý
    avatar: { type: String, default: "https://example.com/default-avatar.png" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Admin = mongoose.model("Admin", AdminSchema);
module.exports = Admin;
