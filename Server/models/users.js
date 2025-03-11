import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone_number: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10,15}$/, "Please enter a valid phone number"],
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    registration_date: {
      type: Date,
      default: Date.now,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    avatar_image_path: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
