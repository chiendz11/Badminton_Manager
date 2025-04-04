// models/ChartData.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const MonthSchema = new Schema(
  {
    month: { type: String, required: true },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 }
  },
  { _id: false }
);

// Mảng mặc định cho 12 tháng từ T1 đến T12
const defaultMonths = [];
for (let i = 1; i <= 12; i++) {
  defaultMonths.push({
    month: "T" + i,
    completed: 0,
    cancelled: 0
  });
}

const ChartDataSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    months: { type: [MonthSchema], default: defaultMonths }
  },
  { timestamps: true }
);

export default model("Chart", ChartDataSchema);
