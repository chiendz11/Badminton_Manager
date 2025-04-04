import mongoose from "mongoose";

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


const Rating = mongoose.model("Rating", RatingSchema) || model("Rating", RatingSchema);
export default Rating;
