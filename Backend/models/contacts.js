import mongoose from "mongoose";
const { Schema, model } = mongoose;

const contactSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  topic: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});
contactSchema.index({ userId: 1, timestamp: -1 }); // Để tìm các liên hệ của một người dùng và sắp xếp theo thời gian
const Contact = model("Contact", contactSchema);
export default Contact;

