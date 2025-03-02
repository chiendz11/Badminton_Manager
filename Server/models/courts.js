const mongoose = require("mongoose");

const courtSchema = new mongoose.Schema({
  centerId: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true },
  name: { type: String, required: true },

  // Bảng giá
  pricing: {
    weekdayRates: [
      { startTime: String, endTime: String, pricePerHour: Number }
    ],
    weekendRates: [
      { startTime: String, endTime: String, pricePerHour: Number }
    ]
  },

  createdAt: { type: Date, default: Date.now }
});

const Court = mongoose.model("Court", courtSchema, "courts");
module.exports = Court;