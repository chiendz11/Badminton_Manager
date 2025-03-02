const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema({
  center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  stars: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Đảm bảo model được export chính xác
const Rating = mongoose.model("Rating", RatingSchema);
module.exports = Rating;
