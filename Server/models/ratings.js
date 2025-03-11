const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    center: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Center", 
      required: true 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    stars: { 
      type: Number, 
      min: 1, 
      max: 5, 
      required: true 
    },
    comment: { 
      type: String, 
      trim: true, 
      maxlength: 500 // Giới hạn số ký tự bình luận
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  },
  { 
    timestamps: true // Thêm createdAt & updatedAt tự động
  }
);

// Đảm bảo một user chỉ đánh giá 1 lần trên mỗi center
RatingSchema.index({ center: 1, user: 1 }, { unique: true });

const Rating = mongoose.model("Rating", RatingSchema);
module.exports = Rating;
