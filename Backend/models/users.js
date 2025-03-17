import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserSchema = new Schema(
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
    // Username và password_hash sẽ để trống nếu role là "guest"
    username: {
      type: String,
      trim: true,
      default: "",
    },
    password_hash: {
      type: String,
      default: "",
    },
    avatar_image_path: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["member", "guest"],
      default: "member",
    },
  },
  { timestamps: true }
);

// Nếu là user thật (member), bắt buộc phải có username và password_hash
UserSchema.pre("validate", function (next) {
  if (this.role === "member") {
    if (!this.username) {
      this.invalidate("username", "Username is required for member accounts");
    }
    if (!this.password_hash) {
      this.invalidate("password_hash", "Password is required for member accounts");
    }
  }
  next();
});

const User = model("User", UserSchema);

export default User;
