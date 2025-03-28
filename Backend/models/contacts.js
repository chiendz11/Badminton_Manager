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

const Contact = model("Contact", contactSchema);
export default Contact;