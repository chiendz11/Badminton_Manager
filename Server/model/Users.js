const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    library_card_number: String,
    email: String,
    phone_number: String,
    address: String,
    registration_date: Date,
    outstanding_fees: Number,
    username: String,
    password_hash: String,
    avatar_image_path: String
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
