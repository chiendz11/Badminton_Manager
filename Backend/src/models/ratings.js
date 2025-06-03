import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema({
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    maxlength: 500
  }
}, {
  timestamps: true // Tự động thêm createdAt & updatedAt
});
RatingSchema.index({ center: 1, createdAt: -1 }); // Để lấy đánh giá theo trung tâm và sắp xếp theo thời gian
RatingSchema.index({ user: 1, createdAt: -1 }); // Để lấy đánh giá của một người dùng và sắp xếp theo thời gian
RatingSchema.index({ center: 1, user: 1 }, { unique: true }); // Nếu mỗi user chỉ đánh giá 1 trung tâm 1 lần

const Rating = mongoose.model("Rating", RatingSchema) || model("Rating", RatingSchema);
export default Rating;
